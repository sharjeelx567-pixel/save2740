/**
 * Application-wide constants
 * Centralized configuration values to maintain consistency across the app
 */

// Financial Constants
export const FINANCIAL = {
  YEARLY_SAVINGS_GOAL: 10000,
  DAILY_SAVINGS_AMOUNT: 27.4,
  MINIMUM_TOP_UP: 10,
  SAVER_POCKET_MIN_MULTIPLIER: 1,
  SAVER_POCKET_MAX_MULTIPLIER: 10,
} as const;

// API Configuration
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000",
  ENDPOINTS: {
    WALLET: "/api/wallet",
    WALLET_DEPOSIT: "/api/wallet/deposit",
    WALLET_WITHDRAW: "/api/wallet/withdraw",
    WALLET_LIMITS: "/api/wallet/limits",
    WALLET_ESCROW: "/api/wallet/escrow",
    WALLET_FREEZE: "/api/wallet/freeze",
    WALLET_UNFREEZE: "/api/wallet/unfreeze",
    TRANSACTIONS: "/api/wallet/transactions",
    TRANSACTIONS_PENDING: "/api/wallet/transactions/pending",
    TRANSACTIONS_FAILED: "/api/wallet/transactions/failed",
    AUTH_LOGOUT: "/api/auth/logout",
    PHONE_VERIFICATION: "/api/auth/send-phone-otp",
    BIOMETRIC_REGISTER: "/api/auth/biometric/register",
    // Dashboard Endpoints
    DASHBOARD_OVERVIEW: "/api/dashboard/overview",
    DASHBOARD_STATS: "/api/dashboard/stats",
    DASHBOARD_BREAKDOWN: "/api/dashboard/savings-breakdown",
    DASHBOARD_CONTRIBUTION: "/api/dashboard/contribution",
    DASHBOARD_STREAK: "/api/dashboard/streak",
    DASHBOARD_ACHIEVEMENTS: "/api/dashboard/achievements",
  },
  TIMEOUT: 30000, // 30 seconds
} as const;

// UI Constants
export const UI = {
  SKELETON_ITEMS: 4,
  RECENT_DEPOSITS_LIMIT: 5,
  TOAST_DURATION: 3000,
} as const;

// Storage Keys
export const STORAGE = {
  TOKEN: "token",
  USER_ID: "userId",
  SESSION_EXPIRY: "sessionExpiry",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection.",
  FETCH_WALLET: "Failed to fetch wallet data. Please try again.",
  FETCH_TRANSACTIONS: "Failed to fetch transactions. Please try again.",
  UNAUTHORIZED: "Session expired. Please log in again.",
  SERVER_ERROR: "Server error. Please try again later.",
} as const;

// Date Formats
export const DATE_FORMATS = {
  LOCALE: "en-US",
  SHORT_DATE: {
    year: "numeric" as const,
    month: "2-digit" as const,
    day: "2-digit" as const,
  },
} as const;

