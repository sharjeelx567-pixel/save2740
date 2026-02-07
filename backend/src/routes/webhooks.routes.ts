import express from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Transaction } from '../models/transaction.model';
import { Wallet } from '../models/wallet.model';
import { WebhookEvent } from '../models/webhook-event.model';
import { LedgerService } from '../services/ledger.service';
import { ReceiptService } from '../services/receipt.service';
import { getStripeProcessor } from '../utils/stripe-processor';
import { logAuditEvent } from '../services/audit-service';
import { notifyTransactionSuccess, notifyTransactionFailed, notifyAdminsPaymentReceived } from '../utils/notification-service';
import { User } from '../models/auth.model';

const router = express.Router();

/**
 * Stripe Webhook Handler with Idempotency
 * Prevents duplicate processing and tracks all webhook events
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
        console.warn('⚠️  Stripe Webhook Secret not configured');
        return res.status(400).json({
            success: false,
            error: 'Webhook Secret not configured'
        });
    }

    let event: Stripe.Event;

    // Step 1: Verify webhook signature
    try {
        const stripeProcessor = getStripeProcessor();
        const stripe = stripeProcessor.getStripeInstance();
        event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).json({
            success: false,
            error: `Webhook Error: ${err.message}`
        });
    }

    try {
        await connectDB();

        // Step 2: Check for duplicate event (Idempotency)
        const existingEvent = await WebhookEvent.findOne({
            eventId: event.id,
            provider: 'stripe'
        });

        if (existingEvent) {
            if (existingEvent.status === 'processed') {
                console.log(`✅ Webhook ${event.id} already processed. Skipping.`);
                return res.json({
                    received: true,
                    eventType: event.type,
                    status: 'duplicate',
                    processedAt: existingEvent.processedAt
                });
            } else if (existingEvent.status === 'processing') {
                console.log(`⏳ Webhook ${event.id} is currently being processed. Skipping.`);
                return res.json({
                    received: true,
                    eventType: event.type,
                    status: 'processing'
                });
            }
        }

        // Step 3: Create webhook event record
        const webhookEvent = existingEvent || await WebhookEvent.create({
            eventId: event.id,
            provider: 'stripe',
            eventType: event.type,
            status: 'processing',
            payload: event,
            processingAttempts: 0,
            metadata: {
                apiVersion: event.api_version,
                livemode: event.livemode
            }
        });

        webhookEvent.status = 'processing';
        webhookEvent.processingAttempts += 1;
        await webhookEvent.save();

        // Step 4: Handle the event
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, webhookEvent);
                    break;

                case 'payment_intent.payment_failed':
                    await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, webhookEvent);
                    break;

                case 'payment_intent.requires_action':
                    await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent, webhookEvent);
                    break;

                case 'charge.refunded':
                    await handleChargeRefunded(event.data.object as Stripe.Charge, webhookEvent);
                    break;

                case 'payment_intent.canceled':
                    await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent, webhookEvent);
                    break;

                case 'payment_intent.processing':
                    await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent, webhookEvent);
                    break;

                case 'setup_intent.succeeded':
                    await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent, webhookEvent);
                    break;

                case 'setup_intent.setup_failed':
                    await handleSetupIntentFailed(event.data.object as Stripe.SetupIntent, webhookEvent);
                    break;

                case 'setup_intent.requires_action':
                    console.log('⚠️ SetupIntent requires action:', event.data.object.id);
                    // Frontend handles this during confirmCardSetup
                    break;

                case 'customer.created':
                    console.log('✅ Customer created:', event.data.object.id);
                    break;

                case 'payment_method.attached':
                    console.log('✅ Payment method attached:', event.data.object.id);
                    break;

                case 'payment_method.detached':
                    await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod, webhookEvent);
                    break;

                default:
                    console.log(`ℹ️  Unhandled event type: ${event.type}`);
                    webhookEvent.status = 'ignored';
            }

            // Step 5: Mark as processed
            if (webhookEvent.status === 'processing') {
                webhookEvent.status = 'processed';
            }
            webhookEvent.processedAt = new Date();
            await webhookEvent.save();

            res.json({
                received: true,
                eventType: event.type,
                eventId: event.id,
                status: webhookEvent.status
            });

        } catch (handlerError: any) {
            console.error(`❌ Error handling webhook ${event.type}:`, handlerError);

            webhookEvent.status = 'failed';
            webhookEvent.lastProcessingError = handlerError.message;
            await webhookEvent.save();

            // Return 200 to acknowledge receipt but log the error
            res.json({
                received: true,
                eventType: event.type,
                status: 'failed',
                error: handlerError.message
            });
        }

    } catch (error: any) {
        console.error('❌ Webhook handler error:', error);
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed',
            message: error.message
        });
    }
});

/**
 * Handle successful payment intent with double-entry ledger
 */
async function handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    webhookEvent: any
) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = paymentIntent.metadata?.userId;
        const transactionType = paymentIntent.metadata?.transactionType || 'deposit';

        if (!userId) {
            console.error('❌ No userId in payment intent metadata');
            throw new Error('No userId in metadata');
        }

        // Find or create transaction
        let transaction = await Transaction.findOne({
            externalTransactionId: paymentIntent.id
        }).session(session);

        if (!transaction) {
            // Create new transaction
            transaction = await Transaction.create([{
                userId,
                type: transactionType,
                amount: paymentIntent.amount / 100, // Convert from cents
                status: 'completed',
                description: `Stripe ${transactionType}`,
                externalTransactionId: paymentIntent.id,
                paymentMethodId: paymentIntent.payment_method as string,
                completedAt: new Date(),
                metadata: {
                    stripePaymentIntentId: paymentIntent.id,
                    currency: paymentIntent.currency,
                    webhookEventId: webhookEvent._id
                }
            }], { session });
            transaction = transaction[0];
        } else {
            // Update existing transaction
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            await transaction.save({ session });
        }

        // Update wallet if deposit
        if (transactionType === 'deposit') {
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (wallet) {
                const amount = paymentIntent.amount / 100;
                wallet.balance += amount;
                wallet.availableBalance += amount;
                await wallet.save({ session });

                // Record double-entry in ledger
                await LedgerService.recordDoubleEntry(
                    userId,
                    transaction.transactionId,
                    amount,
                    `Stripe ${transactionType}`,
                    'wallet',
                    paymentIntent.id,
                    {
                        stripePaymentIntentId: paymentIntent.id,
                        currency: paymentIntent.currency,
                        webhookEventId: webhookEvent._id
                    },
                    session
                );

                console.log(`✅ Wallet updated for user ${userId}: +$${amount}`);
            }
        }

        // Update webhook metadata
        webhookEvent.metadata.userId = userId;
        webhookEvent.metadata.transactionId = transaction.transactionId;
        webhookEvent.metadata.amount = paymentIntent.amount / 100;

        // Create audit log
        await logAuditEvent({
            userId,
            action: 'payment_succeeded',
            resourceType: 'payment',
            resourceId: transaction._id.toString(),
            metadata: {
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                paymentIntentId: paymentIntent.id
            },
            ipAddress: undefined,
            userAgent: 'Stripe Webhook'
        });

        await session.commitTransaction();

        // Generate receipt (outside transaction for safety)
        try {
            await ReceiptService.generateReceipt(transaction.transactionId, paymentIntent.id);
        } catch (receiptError) {
            console.error('Error generating receipt:', receiptError);
            // Don't fail the webhook if receipt generation fails
        }

        // Send success notification
        try {
            await notifyTransactionSuccess(userId, transaction._id.toString(), paymentIntent.amount / 100);
        } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            // Don't fail the webhook if notification fails
        }

        // Notify admins of new payment
        try {
            const user = await User.findById(userId).select('firstName lastName email').lean();
            const u = user as { firstName?: string; lastName?: string; email?: string } | null;
            const userName = u ? ([u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'A user') : 'A user';
            await notifyAdminsPaymentReceived(userId, userName, paymentIntent.amount / 100, transaction.transactionId);
        } catch (adminNotifyError) {
            console.error('Error notifying admins:', adminNotifyError);
        }

        console.log(`✅ Payment intent succeeded: ${paymentIntent.id}`);
    } catch (error: any) {
        await session.abortTransaction();
        console.error('❌ Error handling payment intent succeeded:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
    webhookEvent: any
) {
    try {
        const userId = paymentIntent.metadata?.userId;

        if (!userId) {
            console.error('❌ No userId in failed payment intent metadata');
            return;
        }

        // Update transaction status
        const transaction = await Transaction.findOne({
            externalTransactionId: paymentIntent.id
        });

        if (transaction) {
            transaction.status = 'failed';
            transaction.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
            if (!transaction.metadata) {
                transaction.metadata = {};
            }
            transaction.metadata.stripePaymentIntentId = paymentIntent.id;
            transaction.metadata.failureReason = paymentIntent.last_payment_error?.message;
            transaction.metadata.failureCode = paymentIntent.last_payment_error?.code;
            transaction.metadata.webhookEventId = webhookEvent._id;
            await transaction.save();

            // Update webhook metadata
            webhookEvent.metadata.userId = userId;
            webhookEvent.metadata.transactionId = transaction.transactionId;
            webhookEvent.metadata.failureReason = paymentIntent.last_payment_error?.message;

            // Create audit log
            await logAuditEvent({
                userId,
                action: 'payment_failed',
                resourceType: 'payment',
                resourceId: transaction._id.toString(),
                metadata: {
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency,
                    paymentIntentId: paymentIntent.id,
                    failureReason: paymentIntent.last_payment_error?.message,
                    failureCode: paymentIntent.last_payment_error?.code
                },
                ipAddress: undefined,
                userAgent: 'Stripe Webhook'
            });

            // Send critical failure notification
            await notifyTransactionFailed(
                userId,
                transaction._id.toString(),
                paymentIntent.amount / 100,
                paymentIntent.last_payment_error?.message || 'Payment failed'
            );
        }

        console.log(`❌ Payment intent failed: ${paymentIntent.id}`);
    } catch (error) {
        console.error('❌ Error handling payment intent failed:', error);
        throw error;
    }
}

/**
 * Handle payment intent canceled
 */
async function handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
    webhookEvent: any
) {
    try {
        const userId = paymentIntent.metadata?.userId;

        if (!userId) {
            console.error('❌ No userId in canceled payment intent metadata');
            return;
        }

        const transaction = await Transaction.findOne({
            externalTransactionId: paymentIntent.id
        });

        if (transaction) {
            transaction.status = 'cancelled';
            if (!transaction.metadata) {
                transaction.metadata = {};
            }
            transaction.metadata.webhookEventId = webhookEvent._id;
            transaction.metadata.cancellationReason = paymentIntent.cancellation_reason;
            await transaction.save();

            webhookEvent.metadata.userId = userId;
            webhookEvent.metadata.transactionId = transaction.transactionId;

            await logAuditEvent({
                userId,
                action: 'payment_canceled',
                resourceType: 'payment',
                resourceId: transaction._id.toString(),
                metadata: {
                    paymentIntentId: paymentIntent.id,
                    cancellationReason: paymentIntent.cancellation_reason
                },
                ipAddress: undefined,
                userAgent: 'Stripe Webhook'
            });
        }

        console.log(`⚠️ Payment intent canceled: ${paymentIntent.id}`);
    } catch (error) {
        console.error('❌ Error handling payment intent canceled:', error);
        throw error;
    }
}

/**
 * Handle payment intent processing
 */
async function handlePaymentIntentProcessing(
    paymentIntent: Stripe.PaymentIntent,
    webhookEvent: any
) {
    try {
        const userId = paymentIntent.metadata?.userId;

        if (!userId) {
            console.error('❌ No userId in processing payment intent metadata');
            return;
        }

        const transaction = await Transaction.findOne({
            externalTransactionId: paymentIntent.id
        });

        if (transaction && transaction.status !== 'completed') {
            transaction.status = 'pending';
            if (!transaction.metadata) {
                transaction.metadata = {};
            }
            transaction.metadata.webhookEventId = webhookEvent._id;
            transaction.metadata.processingStatus = 'processing';
            await transaction.save();

            webhookEvent.metadata.userId = userId;
            webhookEvent.metadata.transactionId = transaction.transactionId;
        }

        console.log(`⏳ Payment intent processing: ${paymentIntent.id}`);
    } catch (error) {
        console.error('❌ Error handling payment intent processing:', error);
        throw error;
    }
}

/**
 * Handle charge refunded with double-entry ledger
 */
async function handleChargeRefunded(
    charge: Stripe.Charge,
    webhookEvent: any
) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const paymentIntentId = charge.payment_intent as string;

        // Find original transaction
        const transaction = await Transaction.findOne({
            externalTransactionId: paymentIntentId
        }).session(session);

        if (!transaction) {
            console.error('❌ Transaction not found for refund');
            throw new Error('Transaction not found for refund');
        }

        const userId = transaction.userId.toString();
        const refundAmount = charge.amount_refunded / 100;

        // Create refund transaction
        const refundTransaction = await Transaction.create([{
            userId: transaction.userId,
            type: 'refund',
            amount: refundAmount,
            status: 'completed',
            description: 'Stripe Refund',
            externalTransactionId: charge.id,
            completedAt: new Date(),
            metadata: {
                originalTransactionId: transaction._id.toString(),
                stripeChargeId: charge.id,
                webhookEventId: webhookEvent._id,
                isPartialRefund: charge.amount_refunded < charge.amount
            }
        }], { session });

        // Update wallet
        const wallet = await Wallet.findOne({ userId: transaction.userId }).session(session);
        if (wallet) {
            wallet.balance -= refundAmount;
            wallet.availableBalance -= refundAmount;

            // Prevent negative balances
            if (wallet.availableBalance < 0) {
                wallet.availableBalance = 0;
            }
            if (wallet.balance < 0) {
                wallet.balance = 0;
            }

            await wallet.save({ session });

            // Record double-entry in ledger (negative entry for refund)
            await LedgerService.recordDoubleEntry(
                userId,
                refundTransaction[0].transactionId,
                -refundAmount, // Negative for refund
                'Stripe Refund',
                'wallet',
                charge.id,
                {
                    originalTransactionId: transaction._id.toString(),
                    stripeChargeId: charge.id,
                    webhookEventId: webhookEvent._id,
                    isPartialRefund: charge.amount_refunded < charge.amount
                },
                session
            );
        }

        // Update webhook metadata
        webhookEvent.metadata.userId = userId;
        webhookEvent.metadata.transactionId = refundTransaction[0].transactionId;
        webhookEvent.metadata.amount = refundAmount;

        // Create audit log
        await logAuditEvent({
            userId,
            action: 'payment_refunded',
            resourceType: 'payment',
            resourceId: refundTransaction[0]._id.toString(),
            metadata: {
                amount: refundAmount,
                originalTransactionId: transaction._id.toString(),
                stripeChargeId: charge.id,
                isPartialRefund: charge.amount_refunded < charge.amount
            },
            ipAddress: undefined,
            userAgent: 'Stripe Webhook'
        });

        await session.commitTransaction();
        console.log(`✅ Charge refunded: ${charge.id} - Amount: $${refundAmount}`);
    } catch (error: any) {
        await session.abortTransaction();
        console.error('❌ Error handling charge refunded:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Handle payment_intent.requires_action
 * This happens when 3D Secure authentication is required
 */
async function handlePaymentIntentRequiresAction(
    paymentIntent: Stripe.PaymentIntent,
    webhookEvent: any
) {
    const userId = paymentIntent.metadata?.userId;
    console.log(`⚠️ Payment requires action: ${paymentIntent.id} for user ${userId}`);

    if (!userId) {
        console.warn('No userId in payment intent metadata');
        return;
    }

    // Update transaction status if exists
    const transaction = await Transaction.findOne({
        externalTransactionId: paymentIntent.id
    });

    if (transaction) {
        transaction.status = 'requires_action';
        transaction.metadata = {
            ...transaction.metadata,
            requiresAction: true,
            nextActionType: paymentIntent.next_action?.type,
            clientSecret: paymentIntent.client_secret // Frontend needs this to complete auth
        };
        await transaction.save();
    }

    // Send notification to user
    try {
        const Notification = (await import('../models/Notification')).default;
        await Notification.create({
            userId,
            type: 'security_alert',
            title: '🔐 Payment Authentication Required',
            message: 'Your payment requires additional verification. Please return to the app to complete.',
            isCritical: true,
            relatedData: {
                transactionId: paymentIntent.id,
                amount: paymentIntent.amount / 100
            }
        });
    } catch (notifError) {
        console.error('Failed to create requires_action notification:', notifError);
    }

    webhookEvent.metadata.requiresAction = true;
    webhookEvent.metadata.userId = userId;
}

/**
 * Handle setup_intent.succeeded
 * This confirms a card was successfully saved for future use
 */
async function handleSetupIntentSucceeded(
    setupIntent: Stripe.SetupIntent,
    webhookEvent: any
) {
    const userId = setupIntent.metadata?.userId;
    const paymentMethodId = setupIntent.payment_method as string;
    
    console.log(`✅ SetupIntent succeeded: ${setupIntent.id} for user ${userId}`);

    if (!userId || !paymentMethodId) {
        console.warn('Missing userId or paymentMethodId in setup intent');
        return;
    }

    // Verify payment method is saved in our DB
    const { PaymentMethod } = await import('../models/payment-method.model');
    const savedMethod = await PaymentMethod.findOne({
        userId,
        stripePaymentMethodId: paymentMethodId
    });

    if (!savedMethod) {
        console.log(`Payment method ${paymentMethodId} not in DB yet (frontend will save it)`);
    } else {
        console.log(`Payment method ${savedMethod._id} confirmed via webhook`);
    }

    // Send notification
    try {
        const Notification = (await import('../models/Notification')).default;
        await Notification.create({
            userId,
            type: 'payment_method_added',
            title: '💳 Payment Method Added',
            message: 'Your card has been securely saved for future payments.',
            relatedData: {
                transactionId: setupIntent.id
            }
        });
    } catch (notifError) {
        console.error('Failed to create setup_intent notification:', notifError);
    }

    webhookEvent.metadata.userId = userId;
    webhookEvent.metadata.paymentMethodId = paymentMethodId;
}

/**
 * Handle setup_intent.setup_failed
 * Card setup failed (declined, expired, etc.)
 */
async function handleSetupIntentFailed(
    setupIntent: Stripe.SetupIntent,
    webhookEvent: any
) {
    const userId = setupIntent.metadata?.userId;
    const errorMessage = setupIntent.last_setup_error?.message || 'Card setup failed';
    
    console.log(`❌ SetupIntent failed: ${setupIntent.id} - ${errorMessage}`);

    if (userId) {
        // Notify user
        try {
            const Notification = (await import('../models/Notification')).default;
            await Notification.create({
                userId,
                type: 'payment_failed',
                title: '❌ Card Setup Failed',
                message: `We couldn't save your card: ${errorMessage}`,
                relatedData: {
                    transactionId: setupIntent.id
                }
            });
        } catch (notifError) {
            console.error('Failed to create setup_failed notification:', notifError);
        }
    }

    webhookEvent.metadata.errorMessage = errorMessage;
    webhookEvent.metadata.userId = userId;
}

/**
 * Handle payment_method.detached
 * Payment method was removed from a customer
 */
async function handlePaymentMethodDetached(
    paymentMethod: Stripe.PaymentMethod,
    webhookEvent: any
) {
    console.log(`🗑️ Payment method detached: ${paymentMethod.id}`);

    // Mark as deleted in our database
    const { PaymentMethod } = await import('../models/payment-method.model');
    const savedMethod = await PaymentMethod.findOne({
        stripePaymentMethodId: paymentMethod.id
    });

    if (savedMethod) {
        savedMethod.status = 'deleted';
        await savedMethod.save();
        console.log(`Marked payment method ${savedMethod._id} as deleted`);
        
        webhookEvent.metadata.localPaymentMethodId = savedMethod._id.toString();
    }
}

export default router;
