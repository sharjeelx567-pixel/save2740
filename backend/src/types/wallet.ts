/**
 * Wallet Types
 * TypeScript interfaces for wallet and funds management
 */

/**
 * Wallet Information
 */
export interface Wallet {
  walletId: string
  userId: string
  balance: number
  availableBalance: number
  pendingBalance: number
  escrowBalance: number
  currency: 'USD'
  status: 'active' | 'frozen' | 'suspended'
  freezeReason?: string
  freezeDate?: string
  createdAt: string
  updatedAt: string
}

/**
 * Transaction Record
 */
export interface Transaction {
  transactionId: string
  walletId: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'refund' | 'fee'
  amount: number
  currency: 'USD'
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  description: string
  reference?: string
  paymentMethod?: 'card' | 'bank_account' | 'stripe' | 'plaid'
  relatedTransactionId?: string
  metadata?: Record<string, unknown>
  createdAt: string
  completedAt?: string
  failureReason?: string
}

/**
 * Wallet Limits
 */
export interface WalletLimits {
  userId: string
  dailyDepositLimit: number
  dailyDepositUsed: number
  monthlyDepositLimit: number
  monthlyDepositUsed: number
  dailyWithdrawalLimit: number
  dailyWithdrawalUsed: number
  monthlyWithdrawalLimit: number
  monthlyWithdrawalUsed: number
  singleTransactionLimit: number
  minDepositAmount: number
  maxDepositAmount: number
  minWithdrawalAmount: number
  maxWithdrawalAmount: number
  lastResetDate: string
}

/**
 * Payment Method (Card or Bank Account)
 */
export interface PaymentMethod {
  paymentMethodId: string
  userId: string
  type: 'card' | 'bank_account'
  isDefault: boolean
  isActive: boolean
  cardDetails?: {
    lastFour: string
    brand: 'visa' | 'mastercard' | 'amex' | 'discover'
    expiryMonth: number
    expiryYear: number
    holderName: string
  }
  bankDetails?: {
    lastFour: string
    bankName: string
    accountType: 'checking' | 'savings'
    holderName: string
  }
  status: 'verified' | 'unverified' | 'invalid'
  stripePaymentMethodId?: string
  plaidAccountId?: string
  createdAt: string
  lastUsedAt?: string
}

/**
 * Add Money Request
 */
export interface AddMoneyRequest {
  amount: number
  paymentMethodId: string
  description?: string
  savePaymentMethod?: boolean
}

/**
 * Withdraw Money Request
 */
export interface WithdrawMoneyRequest {
  amount: number
  paymentMethodId: string
  description?: string
  twoFactorCode?: string
}

/**
 * Transaction Response
 */
export interface TransactionResponse {
  success: boolean
  transaction?: Transaction
  transactionId?: string
  status: 'completed' | 'pending' | 'requires_action'
  message?: string
  error?: string
  clientSecret?: string // For Stripe 3D Secure
  requiresTwoFactor?: boolean
}

/**
 * Wallet Balance Response
 */
export interface WalletBalanceResponse {
  success: boolean
  balance: number
  availableBalance: number
  pendingBalance: number
  escrowBalance: number
  status: 'active' | 'frozen' | 'suspended'
  freezeReason?: string
  lastUpdated: string
}

/**
 * Transaction History Response
 */
export interface TransactionHistoryResponse {
  success: boolean
  transactions: Transaction[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Wallet Limits Response
 */
export interface WalletLimitsResponse {
  success: boolean
  limits: WalletLimits
}

/**
 * Fund Transfer Request
 */
export interface FundTransferRequest {
  recipientWalletId: string
  amount: number
  description?: string
  twoFactorCode?: string
}

/**
 * Escrow Balance Info
 */
export interface EscrowBalance {
  walletId: string
  totalEscrow: number
  transactions: Array<{
    transactionId: string
    amount: number
    reason: string
    releaseDate?: string
    status: 'held' | 'released'
  }>
}

/**
 * Wallet Freeze Request
 */
export interface WalletFreezeRequest {
  reason: string
  duration?: number // in hours
}

/**
 * Wallet Unfreeze Request
 */
export interface WalletUnfreezeRequest {
  verificationCode: string
  reason?: string
}

/**
 * Top-up Success Response
 */
export interface TopUpSuccessResponse {
  success: true
  transactionId: string
  amount: number
  balance: number
  status: 'completed' | 'pending'
  timestamp: string
  nextSteps?: string[]
}

/**
 * Top-up Failure Response
 */
export interface TopUpFailureResponse {
  success: false
  error: string
  errorCode: string
  failureReason: string
  retryable: boolean
  suggestedAction?: string
  supportUrl?: string
}

/**
 * API Request/Response Types
 */
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

/**
 * Wallet Statistics
 */
export interface WalletStats {
  totalSaved: number
  totalDeposited: number
  totalWithdrawn: number
  monthlyDepositAverage: number
  lastDepositAmount?: number
  lastDepositDate?: string
  savingStreak: number
  goalProgress: number
}
