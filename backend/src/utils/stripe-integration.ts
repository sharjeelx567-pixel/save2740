/**
 * Stripe Integration for Save2740
 * Handles ACH and card funding for wallet top-ups
 * 
 * Features:
 * - ACH debits (low cost, primary method)
 * - Card payments (instant, higher fees, optional)
 * - Customer management
 * - Webhook handling for async events
 */

import Stripe from 'stripe';
import { IPaymentProcessor, ProcessPaymentRequest, ProcessPaymentResponse, PaymentMethodData, TokenizePaymentMethodResponse, VerifyPaymentMethodResponse } from './payment-processor';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

export class StripePaymentProcessor implements IPaymentProcessor {
    /**
     * Tokenize payment method (save securely with Stripe)
     */
    async tokenizePaymentMethod(data: PaymentMethodData): Promise<TokenizePaymentMethodResponse> {
        try {
            let paymentMethod: Stripe.PaymentMethod;

            if (data.type === 'card') {
                // Create card payment method
                paymentMethod = await stripe.paymentMethods.create({
                    type: 'card',
                    card: {
                        number: data.cardNumber!,
                        exp_month: data.cardExpMonth!,
                        exp_year: data.cardExpYear!,
                        cvc: data.cardCvc!,
                    },
                    billing_details: {
                        name: data.cardHolderName,
                        email: data.billingEmail,
                    },
                });

                return {
                    success: true,
                    externalId: paymentMethod.id,
                    last4: paymentMethod.card!.last4,
                    brand: paymentMethod.card!.brand,
                    expiryMonth: paymentMethod.card!.exp_month,
                    expiryYear: paymentMethod.card!.exp_year,
                };

            } else if (data.type === 'bank_account') {
                // For ACH, we need to use Stripe's bank account setup flow
                // This typically requires plaid_token or manual entry

                // Note: In production, you'd use Plaid or Stripe Identity for ACH setup
                // This is a simplified example
                const token = await stripe.tokens.create({
                    bank_account: {
                        country: 'US',
                        currency: 'usd',
                        account_holder_name: data.accountHolderName!,
                        account_holder_type: 'individual',
                        routing_number: data.routingNumber!,
                        account_number: data.accountNumber!,
                    },
                });

                return {
                    success: true,
                    externalId: token.id,
                    last4: token.bank_account!.last4,
                };
            }

            throw new Error('Unsupported payment method type');

        } catch (error: any) {
            console.error('[STRIPE] Tokenization failed:', error);
            return {
                success: false,
                externalId: '',
                last4: '',
                error: error.message || 'Failed to tokenize payment method',
            };
        }
    }

    /**
     * Process payment (charge card or ACH debit)
     */
    async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
        try {
            const { userId, amount, currency, paymentMethodId, metadata } = request;

            // Create or retrieve Stripe customer
            const customerId = await this.getOrCreateCustomer(userId);

            // Create Payment Intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount), // Amount in cents
                currency: currency.toLowerCase(),
                customer: customerId,
                payment_method: paymentMethodId,
                confirm: true,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never',
                },
                metadata: {
                    userId,
                    ...metadata,
                },
            });

            // Calculate fee
            const fee = this.calculateFee(amount, paymentIntent.payment_method_types[0] === 'card' ? 'card' : 'bank_account');

            return {
                success: paymentIntent.status === 'succeeded',
                transactionId: paymentIntent.id,
                externalTransactionId: paymentIntent.id,
                amount,
                fee: fee.amount,
                net: amount - fee.amount,
                status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
                message: `Payment ${paymentIntent.status}`,
            };

        } catch (error: any) {
            console.error('[STRIPE] Payment processing failed:', error);
            return {
                success: false,
                transactionId: '',
                amount: request.amount,
                fee: 0,
                net: request.amount,
                status: 'failed',
                error: error.message || 'Payment processing failed',
            };
        }
    }

    /**
     * Refund a payment
     */
    async refundPayment(transactionId: string, amount?: number): Promise<{
        success: boolean;
        refundId: string;
        message?: string;
        error?: string;
    }> {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: transactionId,
                amount: amount ? Math.round(amount) : undefined,
            });

            return {
                success: refund.status === 'succeeded',
                refundId: refund.id,
                message: `Refund ${refund.status}`,
            };

        } catch (error: any) {
            console.error('[STRIPE] Refund failed:', error);
            return {
                success: false,
                refundId: '',
                error: error.message || 'Refund failed',
            };
        }
    }

    /**
     * Verify a saved payment method
     */
    async verifyPaymentMethod(externalId: string): Promise<VerifyPaymentMethodResponse> {
        try {
            const paymentMethod = await stripe.paymentMethods.retrieve(externalId);

            return {
                success: true,
                isVerified: true,
                message: 'Payment method verified',
            };

        } catch (error: any) {
            console.error('[STRIPE] Verification failed:', error);
            return {
                success: false,
                isVerified: false,
                error: error.message || 'Verification failed',
            };
        }
    }

    /**
     * Delete a saved payment method
     */
    async deletePaymentMethod(externalId: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }> {
        try {
            await stripe.paymentMethods.detach(externalId);

            return {
                success: true,
                message: 'Payment method deleted',
            };

        } catch (error: any) {
            console.error('[STRIPE] Deletion failed:', error);
            return {
                success: false,
                error: error.message || 'Deletion failed',
            };
        }
    }

    /**
     * Calculate Stripe fees
     * Card: 2.9% + $0.30
     * ACH: 0.8% capped at $5
     */
    calculateFee(amount: number, type: 'card' | 'bank_account'): {
        amount: number;
        percentage: number;
        fixed: number;
    } {
        if (type === 'card') {
            const percentage = amount * 0.029;
            const fixed = 30; // $0.30 in cents
            return {
                amount: Math.round(percentage + fixed),
                percentage: 2.9,
                fixed: 0.3,
            };
        } else {
            // ACH: 0.8% capped at $5
            const percentage = amount * 0.008;
            const capped = Math.min(percentage, 500); // Cap at $5
            return {
                amount: Math.round(capped),
                percentage: 0.8,
                fixed: 0,
            };
        }
    }

    /**
     * Get or create Stripe customer for user
     */
    private async getOrCreateCustomer(userId: string): Promise<string> {
        // TODO: Store Stripe customer ID in User model
        // For now, create new customer each time
        const customer = await stripe.customers.create({
            metadata: {
                userId,
            },
        });

        return customer.id;
    }

    /**
     * Process ACH debit for wallet funding
     */
    async processACHDebit(params: {
        userId: string;
        amount: number;
        bankAccountToken: string;
    }): Promise<{
        success: boolean;
        transactionId?: string;
        status?: 'pending' | 'completed' | 'failed';
        error?: string;
    }> {
        try {
            const customerId = await this.getOrCreateCustomer(params.userId);

            // Attach bank account to customer
            const source = await stripe.customers.createSource(customerId, {
                source: params.bankAccountToken,
            });

            // Create ACH charge
            const charge = await stripe.charges.create({
                amount: Math.round(params.amount),
                currency: 'usd',
                customer: customerId,
                source: source.id,
                metadata: {
                    userId: params.userId,
                    type: 'wallet_funding',
                },
            });

            return {
                success: true,
                transactionId: charge.id,
                status: charge.status === 'succeeded' ? 'completed' : 'pending',
            };

        } catch (error: any) {
            console.error('[STRIPE] ACH debit failed:', error);
            return {
                success: false,
                error: error.message || 'ACH debit failed',
            };
        }
    }
}

/**
 * Handle Stripe webhooks
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<{
    success: boolean;
    message?: string;
}> {
    console.log(`📧 [STRIPE WEBHOOK] Received: ${event.type}`);

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
                break;

            case 'charge.refunded':
                await handleRefund(event.data.object as Stripe.Charge);
                break;

            default:
                console.log(`⏭️  [STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
        }

        return { success: true, message: 'Webhook processed' };

    } catch (error: any) {
        console.error('[STRIPE WEBHOOK] Processing failed:', error);
        return {
            success: false,
            message: error.message,
        };
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`✅ [STRIPE] Payment succeeded: ${paymentIntent.id}`);
    // TODO: Update transaction status in database
    // TODO: Credit user's wallet
    // TODO: Send confirmation notification
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`❌ [STRIPE] Payment failed: ${paymentIntent.id}`);
    // TODO: Update transaction status in database
    // TODO: Notify user of failure
    // TODO: Suggest alternative payment method
}

async function handleRefund(charge: Stripe.Charge): Promise<void> {
    console.log(`↩️  [STRIPE] Refund processed: ${charge.id}`);
    // TODO: Update transaction in database
    // TODO: Deduct from user's wallet
    // TODO: Notify user
}

async function handleBankAccountVerified(source: any): Promise<void> {
    console.log(`✅ [STRIPE] Bank account verified: ${source.id}`);
    // TODO: Mark payment method as verified
    // TODO: Notify user
}

// Export singleton instance
export const stripeProcessor = new StripePaymentProcessor();
