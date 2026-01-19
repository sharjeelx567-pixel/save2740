/**
 * Centralized TypeScript types for API responses and application state
 */

/**
 * Wallet balance information
 */
export interface WalletData {
  userId: string;
  balance: number;
  availableBalance: number;
  locked: number;
  lockedInPockets: number;
  referral: number;
  referralEarnings: number;
  totalBalance: number;
  lastDailySavingDate: string;
  currentStreak: number;
  dailySavingAmount: number;
}

/**
 * Individual transaction record
 */
export interface Transaction {
  id: string;
  type: "credit" | "debit" | "deposit" | "withdrawal";
  description: string;
  amount: number;
  fee?: number;
  date: string;
  status: "completed" | "pending" | "failed";
  timestamp: string;
  createdAt: string;
}

/**
 * Transactions list response from API
 */
export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

/**
 * Breakdown item for savings analysis
 */
export interface BreakdownItem {
  label: string;
  value: string;
  progress?: number;
  isProjected?: boolean;
}

/**
 * Deposit/transaction display format
 */
export interface Deposit {
  label: string;
  date: string;
  amount: string;
}

/**
 * Stat card display data
 */
export interface StatCard {
  label: string;
  value: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

/**
 * API Error response structure
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  status?: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiErrorResponse;
  success: boolean;
}
