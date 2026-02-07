/**
 * Stripe Payment Processor Implementation
 * Implements the IPaymentProcessor interface for Stripe
 */

import Stripe from 'stripe';
import {
    IPaymentProcessor,
    PaymentMethodData,
    ProcessPaymentRequest,
    ProcessPaymentResponse,
    TokenizePaymentMethodResponse,
    VerifyPaymentMethodResponse
} from './payment-processor';

export class StripePaymentProcessor implements IPaymentProcessor {
    private stripe: Stripe;

    constructor() {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

        if (!stripeSecretKey) {
            console.warn('⚠️  Stripe secret key not configured');
            throw new Error('Stripe secret key is required');
        }

        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2026-01-28.clover'
        });
    }

    /**
     * Tokenize a payment method with Stripe
     */
    async tokenizePaymentMethod(data: PaymentMethodData): Promise<TokenizePaymentMethodResponse> {
        try {
            if (data.type === 'card' && data.cardNumber) {
                // Create a payment method with card details
                const paymentMethod = await this.stripe.paymentMethods.create({
                    type: 'card',
                    card: {
                        number: data.cardNumber,
                        exp_month: data.cardExpMonth!,
                        exp_year: data.cardExpYear!,
                        cvc: data.cardCvc!
                    },
                    billing_details: {
                        name: data.cardHolderName,
                        email: data.billingEmail
                    }
                });

                return {
                    success: true,
                    externalId: paymentMethod.id,
                    last4: paymentMethod.card?.last4 || '0000',
                    brand: paymentMethod.card?.brand,
                    expiryMonth: paymentMethod.card?.exp_month,
                    expiryYear: paymentMethod.card?.exp_year,
                    message: 'Payment method tokenized successfully'
                };
            } else if (data.type === 'bank_account' && data.accountNumber) {
                // Create a bank account token
                const token = await this.stripe.tokens.create({
                    bank_account: {
                        country: data.billingCountry || 'US',
                        currency: 'usd',
                        account_holder_name: data.accountHolderName!,
                        account_holder_type: 'individual',
                        routing_number: data.routingNumber!,
                        account_number: data.accountNumber
                    }
                });

                return {
                    success: true,
                    externalId: token.id,
                    last4: token.bank_account?.last4 || '0000',
                    message: 'Bank account tokenized successfully'
                };
            }

            return {
                success: false,
                externalId: '',
                last4: '',
                error: 'Invalid payment method data'
            };
        } catch (error: any) {
            console.error('Stripe tokenization error:', error);
            return {
                success: false,
                externalId: '',
                last4: '',
                error: error.message || 'Failed to tokenize payment method'
            };
        }
    }

    /**
     * Process a payment via Stripe
     */
    async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
        try {
            // Create or use existing customer
            let customerId: string | undefined;

            // If paymentMethodId is provided, use it
            if (request.paymentMethodId) {
                customerId = request.metadata?.stripeCustomerId as string;
            }

            // Create payment intent
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: request.amount, // Amount in cents
                currency: request.currency.toLowerCase(),
                payment_method: request.paymentMethodId,
                customer: customerId,
                confirm: true, // Auto-confirm the payment
                automatic_payment_methods: request.paymentMethodId ? undefined : {
                    enabled: true,
                    allow_redirects: 'never'
                },
                metadata: request.metadata || {}
            });

            // Calculate fee (Stripe's fee structure)
            const fee = this.calculateFee(
                request.amount,
                request.paymentData?.type || 'card'
            );

            return {
                success: paymentIntent.status === 'succeeded',
                transactionId: `stripe_${paymentIntent.id}`,
                externalTransactionId: paymentIntent.id,
                amount: request.amount,
                fee: fee.amount,
                net: request.amount - fee.amount,
                status: paymentIntent.status === 'succeeded' ? 'completed' :
                    paymentIntent.status === 'processing' ? 'pending' : 'failed',
                message: paymentIntent.status === 'succeeded' ?
                    'Payment processed successfully' :
                    `Payment status: ${paymentIntent.status}`
            };
        } catch (error: any) {
            console.error('Stripe payment processing error:', error);
            return {
                success: false,
                transactionId: '',
                amount: request.amount,
                fee: 0,
                net: request.amount,
                status: 'failed',
                error: error.message || 'Failed to process payment'
            };
        }
    }

    /**
     * Refund a payment
     */
    async refundPayment(
        transactionId: string,
        amount?: number
    ): Promise<{ success: boolean; refundId: string; message?: string; error?: string }> {
        try {
            // Extract Stripe payment intent ID
            const paymentIntentId = transactionId.replace('stripe_', '');

            const refund = await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount // If undefined, refunds the full amount
            });

            return {
                success: refund.status === 'succeeded',
                refundId: refund.id,
                message: 'Refund processed successfully'
            };
        } catch (error: any) {
            console.error('Stripe refund error:', error);
            return {
                success: false,
                refundId: '',
                error: error.message || 'Failed to process refund'
            };
        }
    }

    /**
     * Verify a payment method
     */
    async verifyPaymentMethod(externalId: string): Promise<VerifyPaymentMethodResponse> {
        try {
            const paymentMethod = await this.stripe.paymentMethods.retrieve(externalId);

            return {
                success: true,
                isVerified: !!paymentMethod,
                message: 'Payment method verified'
            };
        } catch (error: any) {
            console.error('Stripe payment method verification error:', error);
            return {
                success: false,
                isVerified: false,
                error: error.message || 'Failed to verify payment method'
            };
        }
    }

    /**
     * Delete a payment method
     */
    async deletePaymentMethod(
        externalId: string
    ): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            await this.stripe.paymentMethods.detach(externalId);

            return {
                success: true,
                message: 'Payment method deleted successfully'
            };
        } catch (error: any) {
            console.error('Stripe payment method deletion error:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete payment method'
            };
        }
    }

    /**
     * Calculate Stripe fees
     * Standard Stripe fee: 2.9% + $0.30 for cards
     * ACH Direct Debit: 0.8%, capped at $5
     */
    calculateFee(
        amount: number,
        type: 'card' | 'bank_account'
    ): { amount: number; percentage: number; fixed: number } {
        if (type === 'card') {
            const percentage = amount * 0.029; // 2.9%
            const fixed = 30; // $0.30 in cents
            return {
                amount: Math.round(percentage + fixed),
                percentage: 2.9,
                fixed: 0.3
            };
        } else {
            // ACH Direct Debit
            const percentage = amount * 0.008; // 0.8%
            const fee = Math.min(Math.round(percentage), 500); // Capped at $5 (500 cents)
            return {
                amount: fee,
                percentage: 0.8,
                fixed: 0
            };
        }
    }

    /**
     * Create a Stripe customer
     */
    async createCustomer(email: string, name?: string, metadata?: any): Promise<string> {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
                metadata
            });

            return customer.id;
        } catch (error: any) {
            console.error('Stripe customer creation error:', error);
            throw new Error('Failed to create Stripe customer');
        }
    }

    /**
     * Create a payment intent (for client-side confirmation)
     */
    async createPaymentIntent(
        amount: number,
        currency: string,
        customerId?: string,
        metadata?: any,
        options?: { setupFutureUsage?: boolean; paymentMethodId?: string }
    ): Promise<{ clientSecret: string; paymentIntentId: string }> {
        try {
            const createOptions: any = {
                amount,
                currency: currency.toLowerCase(),
                customer: customerId,
                metadata
            };

            // If a saved payment method is provided, use it
            if (options?.paymentMethodId) {
                createOptions.payment_method = options.paymentMethodId;
                createOptions.confirm = true; // Automatically confirm the payment
                createOptions.off_session = false; // User is present
                createOptions.return_url = process.env.FRONTEND_URL || 'http://localhost:3000';
            } else {
                createOptions.automatic_payment_methods = {
                    enabled: true
                };
            }

            if (options?.setupFutureUsage) {
                createOptions.setup_future_usage = 'off_session';
            }

            const paymentIntent = await this.stripe.paymentIntents.create(createOptions);

            return {
                clientSecret: paymentIntent.client_secret!,
                paymentIntentId: paymentIntent.id
            };
        } catch (error: any) {
            console.error('Stripe payment intent creation error:', error);
            throw new Error(error.message || 'Failed to create payment intent');
        }
    }

    /**
     * Get Stripe instance (for advanced operations)
     */
    getStripeInstance(): Stripe {
        return this.stripe;
    }
}

// Export a singleton instance
let stripeProcessorInstance: StripePaymentProcessor | null = null;

export function getStripeProcessor(): StripePaymentProcessor {
    if (!stripeProcessorInstance) {
        stripeProcessorInstance = new StripePaymentProcessor();
    }
    return stripeProcessorInstance;
}
