# Save2740 Payment & Withdrawal Architecture

## Executive summary

- **Ledger-first wallet**: User balance, locked, and referral amounts are **ledger entries**, not daily bank transactions.
- **Fund infrequently**: Wallet is funded via **ACH (primary)** or **debit card (optional)** on a **weekly or monthly** cadence (or manual top-up).
- **Daily savings = internal ledger**: Each day at midnight, **$27.40** is moved from **Wallet → Saver Pocket** as an **internal ledger entry** — **no payment rail**, no processor fee, no declines.
- **Withdrawals**: User requests withdrawal → funds released from ledger → **ACH payout** to linked bank account.

This model (Acorns/Chime-style) avoids fee explosion and scaling risk.

---

## 1. User wallet (stored value)

Each user has:

| Balance type | Description |
|--------------|-------------|
| **Available balance** | Spendable in-app; used for daily allocations and withdrawals |
| **Locked balance** | Committed to saver pockets (not yet withdrawn) |
| **Referral earnings** | From referral program |

These are **ledger entries** in our system, not daily bank transactions.

---

## 2. Funding the wallet (infrequent)

Users add money via:

- **ACH (primary)** – low cost, scalable.
- **Debit card (optional)** – instant, higher fees.

**Recommended cadence:**

- **Weekly** ≈ $191.80 (7 × $27.40)
- **Monthly** ≈ $822–833 (≈ 30 × $27.40)
- **Manual top-up** anytime

Daily saving happens **inside** Save2740 (ledger), not via repeated bank or card charges.

---

## 3. Daily saver logic (no payment rail)

Every day (e.g. midnight):

1. **Wallet available balance** → **Saver pocket ledger**
2. **$27.40** → pocket allocation (internal ledger only)
3. **No processor fee**, no declines, no bank dependency

If wallet runs low:

- Warn user
- Pause streak
- Resume when topped up

Implementation: `backend/src/utils/wallet-ledger.ts` (e.g. `processDailySavings`, `allocateToPockets`).

---

## 4. Withdrawals (end of challenge / monthly)

1. User requests withdrawal.
2. Funds released from ledger (e.g. from pockets / available).
3. **ACH payout** to user’s linked bank account (via Stripe/Dwolla).

---

## Stack (best-in-class)

| Layer | Provider | Role |
|-------|----------|------|
| **Wallet + ledger** | Sponsor bank + ledger-first design | Custody + internal balances |
| **Funding rails (ACH + card)** | Stripe (launch); Dwolla (10k–100k users) | ACH debits, card funding, webhooks |
| **Payment operations at scale** | Modern Treasury | Reconciliation, returns, audit trails |
| **Core rule** | — | **Fund infrequently → allocate daily internally** |

---

## Fee reality (why wallet wins)

| Model | Annual events | Risk |
|-------|----------------|------|
| Daily card charges | ~3.6M | High (declines, disputes) |
| Daily ACH pulls | ~3.6M | High (returns) |
| **Wallet funding (weekly/monthly)** | **~120k** | **Low** |
| **Ledger allocations (daily)** | **Unlimited** | **$0 fee, none** |

---

## Compliance

- Use **custodial accounts** (not co-mingled).
- Run **KYC** on users who fund wallets.
- Maintain **ledger integrity**.
- Clearly state: **“Save2740 is a savings facilitation platform, not a bank.”**

Stripe/Dwolla + sponsor bank handle most of the regulatory heavy lifting.

---

## Code references

- **Constants**: `backend/src/config/payment-architecture.ts` (cadence, compliance text, daily amount).
- **Ledger logic**: `backend/src/utils/wallet-ledger.ts`.
- **Wallet model**: `backend/src/models/wallet.model.ts`.
- **Transactions**: `backend/src/models/transaction.model.ts` (e.g. `save_daily`, `deposit`, `withdrawal`).
