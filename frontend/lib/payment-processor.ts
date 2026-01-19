/**
 * Payment Processor Interface
 * 
 * This is an abstraction layer that allows flexible integration with
 * different payment providers (Stripe, Dwolla, PayPal, etc.)
 * 
 * Implement this interface for each payment provider you want to support.
 */

export interface PaymentMethodData {
  type: 'card' | 'bank_account';
  provider: 'stripe' | 'dwolla' | 'paypal' | 'other';
  
  // Card
  cardNumber?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardCvc?: string;
  cardHolderName?: string;
  
  // Bank Account
  accountNumber?: string;
  routingNumber?: string;
  accountType?: 'checking' | 'savings';
  accountHolderName?: string;
  
  // Billing Address
  billingEmail?: string;
  billingCountry?: string;
}

export interface ProcessPaymentRequest {
  userId: string;
  amount: number; // in cents/smallest unit
  currency: string; // USD, EUR, etc.
  paymentMethodId?: string; // ID of saved payment method
  paymentData?: PaymentMethodData; // For new payment method
  metadata?: {
    [key: string]: any;
  };
}

export interface ProcessPaymentResponse {
  success: boolean;
  transactionId: string;
  externalTransactionId?: string; // Provider's ID
  amount: number;
  fee: number;
  net: number;
  status: 'completed' | 'pending' | 'failed';
  message?: string;
  error?: string;
}

export interface TokenizePaymentMethodResponse {
  success: boolean;
  externalId: string; // Provider's token/ID
  last4: string;
  brand?: string; // For cards
  expiryMonth?: number;
  expiryYear?: number;
  message?: string;
  error?: string;
}

export interface VerifyPaymentMethodResponse {
  success: boolean;
  isVerified: boolean;
  message?: string;
  error?: string;
}

/**
 * Abstract Payment Processor Interface
 * Each payment provider should implement this interface
 */
export interface IPaymentProcessor {
  /**
   * Tokenize a payment method (save securely with provider)
   */
  tokenizePaymentMethod(data: PaymentMethodData): Promise<TokenizePaymentMethodResponse>;

  /**
   * Process a payment/charge
   */
  processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse>;

  /**
   * Refund a payment
   */
  refundPayment(transactionId: string, amount?: number): Promise<{
    success: boolean;
    refundId: string;
    message?: string;
    error?: string;
  }>;

  /**
   * Verify a saved payment method
   */
  verifyPaymentMethod(externalId: string): Promise<VerifyPaymentMethodResponse>;

  /**
   * Delete a saved payment method
   */
  deletePaymentMethod(externalId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;

  /**
   * Calculate fees for a payment
   */
  calculateFee(amount: number, type: 'card' | 'bank_account'): { amount: number; percentage: number; fixed: number };
}

/**
 * Payment Processor Factory
 * Use this to get the appropriate payment processor based on provider
 */
export class PaymentProcessorFactory {
  private static processors: Map<string, IPaymentProcessor> = new Map();

  static register(provider: string, processor: IPaymentProcessor) {
    this.processors.set(provider, processor);
  }

  static getProcessor(provider: string): IPaymentProcessor {
    const processor = this.processors.get(provider);
    if (!processor) {
      throw new Error(`Payment processor '${provider}' not registered`);
    }
    return processor;
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.processors.keys());
  }
}

/**
 * Mock Payment Processor (for testing without real payment gateway)
 * Remove this in production when real processors are registered
 */
export class MockPaymentProcessor implements IPaymentProcessor {
  async tokenizePaymentMethod(data: PaymentMethodData): Promise<TokenizePaymentMethodResponse> {
    // Simulate tokenization
    const last4 = data.cardNumber?.slice(-4) || data.accountNumber?.slice(-4) || '0000';
    const externalId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      externalId,
      last4,
      brand: data.cardNumber ? 'visa' : undefined,
    };
  }

  async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    // Simulate payment processing
    const fee = this.calculateFee(request.amount, request.paymentData?.type || 'card');
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      transactionId,
      externalTransactionId: `mock_${transactionId}`,
      amount: request.amount,
      fee: fee.amount,
      net: request.amount - fee.amount,
      status: 'completed',
      message: 'Mock payment processed successfully',
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<{ success: boolean; refundId: string; message?: string }> {
    return {
      success: true,
      refundId: `refund_${transactionId}`,
      message: 'Mock refund processed successfully',
    };
  }

  async verifyPaymentMethod(externalId: string): Promise<VerifyPaymentMethodResponse> {
    return {
      success: true,
      isVerified: true,
      message: 'Mock payment method verified',
    };
  }

  async deletePaymentMethod(externalId: string): Promise<{ success: boolean; message?: string }> {
    return {
      success: true,
      message: 'Mock payment method deleted',
    };
  }

  calculateFee(amount: number, type: 'card' | 'bank_account'): { amount: number; percentage: number; fixed: number } {
    // Card: 2.9% + $0.30
    // Bank Account: 0.1% (no fixed fee)
    if (type === 'card') {
      const percentage = amount * 0.029;
      const fixed = 30; // $0.30
      return {
        amount: Math.round(percentage + fixed),
        percentage: 2.9,
        fixed: 0.3,
      };
    } else {
      const percentage = Math.round(amount * 0.001);
      return {
        amount: percentage,
        percentage: 0.1,
        fixed: 0,
      };
    }
  }
}

// Register mock processor by default
PaymentProcessorFactory.register('mock', new MockPaymentProcessor());
