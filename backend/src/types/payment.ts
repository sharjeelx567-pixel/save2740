/**
 * Payment & Banking Types
 * Stripe/Plaid integration layer for bank accounts, debit cards, and payment management
 */

/**
 * Bank Account Information
 */
export interface BankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  routingNumber: string; // Last 4 digits shown
  accountNumber: string; // Last 4 digits shown, full stored encrypted
  bankName: string;
  accountType: 'checking' | 'savings' | 'money-market' | 'other';
  status: 'verified' | 'pending' | 'failed' | 'inactive';
  isDefault: boolean;
  verificationMethod: 'micro-deposits' | 'instant' | 'manual';
  verificationStatus: 'unverified' | 'verified' | 'failed';
  microDepositAmounts?: [number, number]; // Two deposits sent for verification
  plaidAccountId: string; // Plaid account token
  linkedAt: string;
  verifiedAt?: string;
  lastUsedAt?: string;
  displayName: string; // User-friendly name (e.g., "My Checking Account")
}

/**
 * Debit Card Information
 */
export interface DebitCard {
  id: string;
  userId: string;
  cardholderName: string;
  cardNumber: string; // Last 4 digits shown, full stored encrypted
  expiryMonth: number;
  expiryYear: number;
  cvv: string; // Stored encrypted
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  isDefault: boolean;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  stripeTokenId: string; // Stripe payment method ID
  linkedAt: string;
  expiresAt: string;
  lastUsedAt?: string;
  displayName: string; // User-friendly name (e.g., "My Visa")
}

/**
 * Payment Method (Union type)
 */
export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'bank-account' | 'debit-card';
  displayName: string;
  last4: string;
  brand?: string;
  issuer?: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt: string;
  linkedData: BankAccount | DebitCard;
}

/**
 * Auto-Debit Setup Configuration
 */
export interface AutoDebit {
  id: string;
  userId: string;
  paymentMethodId: string;
  amount: number; // Amount in cents
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  startDate: string;
  endDate?: string;
  dayOfMonth?: number; // For monthly
  dayOfWeek?: number; // 0=Sunday, 6=Saturday for weekly
  status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  purpose: string; // e.g., "Savings Plan", "Loan Repayment"
  maxRetries: number;
  failureCount: number;
  nextDebitDate: string;
  lastDebitDate?: string;
  createdAt: string;
  failureReason?: string;
  notificationPreference: 'email' | 'sms' | 'both' | 'none';
}

/**
 * Payment Authorization Request/Response
 */
export interface PaymentAuthorization {
  id: string;
  userId: string;
  amount: number; // Amount in cents
  currency: string; // ISO 4217 code
  paymentMethodId: string;
  transactionId?: string;
  description: string;
  merchantName: string;
  status: 'pending' | 'authorized' | 'declined' | 'expired' | 'cancelled';
  authorizationCode?: string;
  riskLevel: 'low' | 'medium' | 'high';
  fraudChecksPassed: boolean;
  cvvMatched?: boolean;
  zipCodeMatched?: boolean;
  avsResponse?: string; // Address Verification System response
  requiresConfirmation: boolean;
  confirmationDeadline?: string;
  createdAt: string;
  expiresAt: string;
  authorizedAt?: string;
  declineReason?: string;
  declineCode?: string;
}

/**
 * Payment Receipt
 */
export interface PaymentReceipt {
  id: string;
  userId: string;
  transactionId: string;
  amount: number; // Amount in cents
  currency: string;
  paymentMethodId: string;
  paymentMethodLast4: string;
  merchantName: string;
  description: string;
  status: 'completed' | 'failed' | 'cancelled' | 'refunded';
  receiptNumber: string;
  authorizationCode: string;
  processingFee: number; // Fee in cents
  netAmount: number; // Amount after fees
  timestamp: string;
  completedAt: string;
  refundedAmount?: number;
  refundedAt?: string;
  refundReason?: string;
  itemsReceived?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  downloadUrl?: string;
}

/**
 * Payment Dispute (Chargeback)
 */
export interface PaymentDispute {
  id: string;
  userId: string;
  transactionId: string;
  receiptId: string;
  amount: number; // Amount in cents
  currency: string;
  status: 'open' | 'under-review' | 'won' | 'lost' | 'cancelled' | 'resolved';
  reason: 'unauthorized' | 'duplicate' | 'fraudulent' | 'service-issue' | 'billing-error' | 'product-not-received' | 'other';
  description: string;
  filedDate: string;
  deadline: string;
  responseDeadline?: string;
  evidence: {
    type: 'receipt' | 'communication' | 'proof-of-delivery' | 'other';
    url: string;
    uploadedAt: string;
  }[];
  customerStatement?: string;
  bankNotes?: string;
  resolution?: {
    type: 'won' | 'lost' | 'settled';
    resolutionDate: string;
    notes: string;
    amountAwarded?: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Chargeback Notice
 */
export interface ChargebackNotice {
  id: string;
  userId: string;
  disputeId: string;
  transactionId: string;
  amount: number; // Amount in cents
  currency: string;
  caseNumber: string;
  status: 'initiated' | 'under-review' | 'resolved' | 'appealed';
  reason: 'unauthorized' | 'duplicate' | 'service-issue' | 'other';
  initiatedDate: string;
  dueDate: string;
  responseDeadline: string;
  description: string;
  merchantName: string;
  cardLast4: string;
  bankName: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  requiredDocuments: {
    name: string;
    submitted: boolean;
    submittedAt?: string;
    documentUrl?: string;
  }[];
  outcome?: {
    decision: 'chargeback-upheld' | 'chargeback-reversed';
    decidedAt: string;
    notes: string;
    amountAwarded: number;
  };
  createdAt: string;
}

/**
 * Bank Account Verification Request
 */
export interface BankAccountVerificationRequest {
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'money-market' | 'other';
  displayName: string;
}

/**
 * Plaid Link Token Response
 */
export interface PlaidLinkTokenResponse {
  token: string;
  expiration: string;
}

/**
 * Plaid Exchange Token Request
 */
export interface PlaidExchangeRequest {
  publicToken: string;
  accountId: string;
}

/**
 * Card Payment Request
 */
export interface CardPaymentRequest {
  amount: number;
  currency: string;
  cardId: string;
  description: string;
  merchantName: string;
  metadata?: Record<string, any>;
}

/**
 * Bank Account Payment Request
 */
export interface BankAccountPaymentRequest {
  amount: number;
  currency: string;
  bankAccountId: string;
  description: string;
  merchantName: string;
  metadata?: Record<string, any>;
}

/**
 * Auto Debit Setup Request
 */
export interface AutoDebitSetupRequest {
  paymentMethodId: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  startDate: string;
  endDate?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  purpose: string;
  maxRetries: number;
  notificationPreference: 'email' | 'sms' | 'both' | 'none';
}

/**
 * Payment Authorization Confirmation Request
 */
export interface PaymentAuthorizationConfirmation {
  authorizationId: string;
  confirmed: boolean;
  cvv?: string; // If additional verification needed
  confirm2FA?: boolean;
}

/**
 * Dispute Filing Request
 */
export interface DisputeFilingRequest {
  transactionId: string;
  reason: 'unauthorized' | 'duplicate' | 'fraudulent' | 'service-issue' | 'billing-error' | 'product-not-received' | 'other';
  description: string;
  evidence?: {
    type: 'receipt' | 'communication' | 'proof-of-delivery' | 'other';
    file: File;
  }[];
}

/**
 * API Responses
 */
export interface BankAccountResponse {
  success: boolean;
  data?: BankAccount;
  error?: string;
}

export interface DebitCardResponse {
  success: boolean;
  data?: DebitCard;
  error?: string;
}

export interface PaymentMethodResponse {
  success: boolean;
  data?: PaymentMethod | PaymentMethod[];
  error?: string;
}

export interface AutoDebitResponse {
  success: boolean;
  data?: AutoDebit;
  error?: string;
}

export interface PaymentAuthorizationResponse {
  success: boolean;
  data?: PaymentAuthorization;
  error?: string;
}

export interface PaymentReceiptResponse {
  success: boolean;
  data?: PaymentReceipt;
  error?: string;
}

export interface PaymentDisputeResponse {
  success: boolean;
  data?: PaymentDispute;
  error?: string;
}

export interface ChargebackNoticeResponse {
  success: boolean;
  data?: ChargebackNotice;
  error?: string;
}

export interface PaymentMethodsListResponse {
  success: boolean;
  data?: {
    bankAccounts: BankAccount[];
    debitCards: DebitCard[];
    defaultMethod: PaymentMethod;
  };
  error?: string;
}

export interface AutoDebitsListResponse {
  success: boolean;
  data?: AutoDebit[];
  error?: string;
}

export interface DisputesListResponse {
  success: boolean;
  data?: PaymentDispute[];
  error?: string;
}

export interface ChargebacksListResponse {
  success: boolean;
  data?: ChargebackNotice[];
  error?: string;
}
