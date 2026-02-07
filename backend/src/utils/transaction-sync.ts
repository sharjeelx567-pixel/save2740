/**
 * Transaction Sync Service
 * Syncs pending transactions with Stripe to update statuses.
 * 
 * Runs every 15 minutes
 */

import { Transaction } from '../models/transaction.model';
import { Wallet } from '../models/wallet.model';
import { addNotificationJob } from './job-queue';
import Stripe from 'stripe';

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2026-01-28.clover' }) : null;

interface SyncResult {
    totalChecked: number;
    updated: number;
    succeeded: number;
    failed: number;
    stillPending: number;
    errors: number;
}

/**
 * Sync pending transactions with Stripe
 */
export async function syncPendingTransactions(): Promise<SyncResult> {
    console.log('🔄 [SYNC] Starting transaction sync...');

    const result: SyncResult = {
        totalChecked: 0,
        updated: 0,
        succeeded: 0,
        failed: 0,
        stillPending: 0,
        errors: 0,
    };

    if (!stripe) {
        console.log('⚠️  [SYNC] Stripe not configured, skipping sync');
        return result;
    }

    try {
        // Get transactions that are pending and have a Stripe ID
        const pendingTransactions = await Transaction.find({
            status: 'pending',
            $or: [
                { stripePaymentIntentId: { $exists: true, $ne: null } },
                { externalId: { $exists: true, $ne: null } },
                { 'metadata.paymentIntentId': { $exists: true } },
            ],
            createdAt: {
                // Only check transactions from last 7 days
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        }).limit(100);

        result.totalChecked = pendingTransactions.length;
        console.log(`📊 [SYNC] Found ${result.totalChecked} pending transactions to check`);

        for (const transaction of pendingTransactions) {
            try {
                const paymentIntentId =
                    transaction.stripePaymentIntentId ||
                    transaction.externalId ||
                    transaction.metadata?.paymentIntentId;

                if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
                    result.stillPending++;
                    continue;
                }

                // Fetch status from Stripe
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

                const previousStatus = transaction.status;
                let newStatus = transaction.status;
                let shouldNotify = false;

                switch (paymentIntent.status) {
                    case 'succeeded':
                        newStatus = 'completed';
                        result.succeeded++;
                        shouldNotify = true;
                        break;
                    case 'canceled':
                        newStatus = 'cancelled';
                        result.failed++;
                        shouldNotify = true;
                        break;
                    case 'requires_payment_method':
                    case 'requires_confirmation':
                    case 'requires_action':
                        // Check if it's been stuck for too long (24 hours)
                        const ageHours = (Date.now() - transaction.createdAt.getTime()) / (1000 * 60 * 60);
                        if (ageHours > 24) {
                            newStatus = 'failed';
                            result.failed++;
                            shouldNotify = true;
                        } else {
                            result.stillPending++;
                        }
                        break;
                    case 'processing':
                        result.stillPending++;
                        break;
                    default:
                        result.stillPending++;
                }

                if (newStatus !== previousStatus) {
                    transaction.status = newStatus;
                    transaction.updatedAt = new Date();

                    if (newStatus === 'completed') {
                        transaction.completedAt = new Date();
                    }

                    await transaction.save();
                    result.updated++;

                    console.log(`🔄 [SYNC] Transaction ${transaction._id}: ${previousStatus} → ${newStatus}`);

                    // Update wallet if deposit succeeded
                    if (newStatus === 'completed' && transaction.type === 'deposit') {
                        await Wallet.updateOne(
                            { userId: transaction.userId },
                            { $inc: { availableBalance: transaction.amount } }
                        );
                    }

                    // Send notification
                    if (shouldNotify) {
                        await sendTransactionStatusNotification(transaction, newStatus);
                    }
                }
            } catch (error: any) {
                // Handle Stripe errors gracefully
                if (error.code === 'resource_missing') {
                    // Payment intent doesn't exist in Stripe, mark as failed
                    transaction.status = 'failed';
                    transaction.metadata = {
                        ...transaction.metadata,
                        syncError: 'Payment intent not found in Stripe',
                    };
                    await transaction.save();
                    result.failed++;
                    result.updated++;
                } else {
                    result.errors++;
                    console.error(`❌ [SYNC] Error syncing transaction ${transaction._id}:`, error.message);
                }
            }
        }

        console.log(`✅ [SYNC] Complete - Updated: ${result.updated}, Succeeded: ${result.succeeded}, Failed: ${result.failed}, Pending: ${result.stillPending}`);
        return result;
    } catch (error) {
        console.error('❌ [SYNC] Fatal error:', error);
        throw error;
    }
}

/**
 * Send notification for transaction status change
 */
async function sendTransactionStatusNotification(transaction: any, status: string): Promise<void> {
    const amount = transaction.amount?.toFixed(2) || '0.00';

    let title: string;
    let message: string;
    let type: 'success' | 'alert' | 'info' = 'info';

    switch (status) {
        case 'completed':
            title = '✅ Transaction Complete';
            message = `Your $${amount} ${transaction.type} was successful!`;
            type = 'success';
            break;
        case 'failed':
            title = '❌ Transaction Failed';
            message = `Your $${amount} ${transaction.type} could not be completed. Please try again.`;
            type = 'alert';
            break;
        case 'cancelled':
            title = '🚫 Transaction Cancelled';
            message = `Your $${amount} ${transaction.type} was cancelled.`;
            type = 'alert';
            break;
        default:
            return;
    }

    await addNotificationJob({
        userId: transaction.userId.toString(),
        title,
        message,
        type,
        data: {
            transactionId: transaction._id.toString(),
            type: transaction.type,
            amount: transaction.amount,
            status,
        },
    });
}

/**
 * Force sync a specific transaction
 */
export async function syncTransaction(transactionId: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
}> {
    if (!stripe) {
        return { success: false, error: 'Stripe not configured' };
    }

    try {
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return { success: false, error: 'Transaction not found' };
        }

        const paymentIntentId =
            transaction.stripePaymentIntentId ||
            transaction.externalId ||
            transaction.metadata?.paymentIntentId;

        if (!paymentIntentId) {
            return { success: false, error: 'No Stripe payment intent ID' };
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return {
            success: true,
            status: paymentIntent.status,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
