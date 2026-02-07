/**
 * Save2740 Payment & Withdrawal Architecture
 * Ledger-first wallet + infrequent funding (ACH/card) + daily internal allocations.
 * Aligns with: Acorns/Chime-style fintech scaling.
 */

/** Daily savings amount (internal ledger allocation — no payment rail) */
export const DAILY_SAVINGS_AMOUNT = 27.4;

/** Recommended funding cadence amounts (USD) */
export const FUNDING_CADENCE = {
  /** Weekly ≈ 7 × $27.40 */
  WEEKLY_AMOUNT: 191.8,
  /** Monthly ≈ 30 × $27.40 */
  MONTHLY_AMOUNT: 822,
  /** Alternative monthly (≈ $833.42 as in spec) */
  MONTHLY_AMOUNT_ALT: 833.42,
  /** Buffer in days for funding reminders */
  RECOMMENDED_BUFFER_DAYS: 14,
} as const;

/** Compliance: platform disclaimer (must be shown where relevant) */
export const COMPLIANCE = {
  PLATFORM_DISCLAIMER:
    'Save2740 is a savings facilitation platform, not a bank. Funds are held in custodial arrangements with our partner institutions.',
  KYC_REQUIRED_FOR_FUNDING: true,
  LEDGER_INTEGRITY_REQUIRED: true,
} as const;

/** Funding rails (primary = ACH, optional = card) */
export const FUNDING_RAILS = {
  PRIMARY: 'ach',
  OPTIONAL: 'card',
} as const;

/** Stack / provider strategy */
export const PAYMENT_STACK = {
  FUNDING: 'Stripe', // ACH + card; consider Dwolla at 10k–100k users
  OPERATIONS_AT_SCALE: 'Modern Treasury', // reconciliation, returns, audit
  RULE: 'Fund infrequently → allocate daily internally',
} as const;
