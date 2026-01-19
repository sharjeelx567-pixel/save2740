// lib/wallet-ledger.ts - Daily savings calculation logic

export interface LedgerEntry {
  id: string
  userId: string
  type: "daily_deduction" | "deposit" | "withdrawal" | "referral" | "fee"
  amount: number
  fee: number
  description: string
  timestamp: Date
  status: "completed" | "pending" | "failed"
  pocketId?: string // If allocated to a specific pocket
}

export interface WalletState {
  availableBalance: number
  lockedInPockets: number
  referralEarnings: number
  lastDailySavingDate: Date | null
  currentStreak: number
  ledger: LedgerEntry[]
}

const DAILY_SAVINGS_AMOUNT = 27.4

/**
 * Process daily $27.40 savings
 * Called at midnight each day via a background job
 */
export function processDailySavings(wallet: WalletState): {
  success: boolean
  message: string
  newBalance: number
  error?: string
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastSavingDate = wallet.lastDailySavingDate
    ? new Date(wallet.lastDailySavingDate)
    : null

  if (lastSavingDate) {
    lastSavingDate.setHours(0, 0, 0, 0)
    if (lastSavingDate.getTime() === today.getTime()) {
      // Already saved today
      return {
        success: false,
        message: "Already saved today",
        newBalance: wallet.availableBalance,
        error: "ALREADY_SAVED_TODAY",
      }
    }
  }

  // Check if user has enough balance
  if (wallet.availableBalance < DAILY_SAVINGS_AMOUNT) {
    return {
      success: false,
      message: `Insufficient balance. Need $${DAILY_SAVINGS_AMOUNT}, have $${wallet.availableBalance.toFixed(2)}`,
      newBalance: wallet.availableBalance,
      error: "INSUFFICIENT_BALANCE",
    }
  }

  // Deduct from available balance
  const newBalance = wallet.availableBalance - DAILY_SAVINGS_AMOUNT

  // Create ledger entry (internal ledger, no payment processing)
  const entry: LedgerEntry = {
    id: `ledger-${Date.now()}`,
    userId: "current-user", // Will be passed in real implementation
    type: "daily_deduction",
    amount: DAILY_SAVINGS_AMOUNT,
    fee: 0, // No fee for internal transfers
    description: "Daily $27.40 Savings",
    timestamp: today,
    status: "completed",
  }

  wallet.ledger.push(entry)

  // Update streak
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastEntryDate = wallet.lastDailySavingDate
    ? new Date(wallet.lastDailySavingDate)
    : null

  if (
    lastEntryDate &&
    lastEntryDate.getTime() ===
    yesterday.setHours(0, 0, 0, 0) &&
    yesterday.getTime()
  ) {
    wallet.currentStreak += 1
  } else {
    wallet.currentStreak = 1
  }

  wallet.lastDailySavingDate = today
  wallet.availableBalance = newBalance

  return {
    success: true,
    message: `Successfully saved $${DAILY_SAVINGS_AMOUNT}. Streak: ${wallet.currentStreak} days`,
    newBalance,
  }
}

/**
 * Check if user is missing today's savings
 */
export function isMissingSavingsToday(wallet: WalletState): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastSavingDate = wallet.lastDailySavingDate
    ? new Date(wallet.lastDailySavingDate)
    : null

  if (!lastSavingDate) return true

  lastSavingDate.setHours(0, 0, 0, 0)
  return lastSavingDate.getTime() !== today.getTime()
}

/**
 * Get savings statistics
 */
export function getSavingsStats(wallet: WalletState) {
  const dailyEntries = wallet.ledger.filter(
    (e) => e.type === "daily_deduction" && e.status === "completed"
  )

  const totalSaved = dailyEntries.reduce((sum, e) => sum + e.amount, 0)
  const daysWithoutStreakBreak = wallet.currentStreak
  const projectedAnnualSavings = totalSaved * (365 / Math.max(1, dailyEntries.length))

  return {
    totalSaved,
    daysCompleted: dailyEntries.length,
    currentStreak: daysWithoutStreakBreak,
    projectedAnnualSavings,
    percentageOfGoal: (totalSaved / 10000) * 100,
  }
}

/**
 * Allocate daily savings to saver pockets
 */
export function allocateToPockets(
  wallet: WalletState,
  pocketAllocations: { pocketId: string; amount: number }[]
) {
  const totalToAllocate = pocketAllocations.reduce((sum, p) => sum + p.amount, 0)

  if (totalToAllocate > wallet.availableBalance) {
    return {
      success: false,
      error: "INSUFFICIENT_BALANCE",
      message: "Not enough balance to allocate to pockets",
    }
  }

  // Create allocation entries
  pocketAllocations.forEach((allocation) => {
    wallet.ledger.push({
      id: `alloc-${Date.now()}-${Math.random()}`,
      userId: "current-user",
      type: "daily_deduction",
      amount: allocation.amount,
      fee: 0,
      description: `Allocation to Saver Pocket`,
      timestamp: new Date(),
      status: "completed",
      pocketId: allocation.pocketId,
    })
  })

  wallet.availableBalance -= totalToAllocate
  wallet.lockedInPockets += totalToAllocate

  return {
    success: true,
    message: "Allocated to pockets successfully",
    newBalance: wallet.availableBalance,
  }
}

/**
 * Get ledger entries for a date range
 */
export function getLedgerEntries(
  wallet: WalletState,
  startDate: Date,
  endDate: Date
) {
  return wallet.ledger.filter((entry) => {
    const entryDate = new Date(entry.timestamp)
    return entryDate >= startDate && entryDate <= endDate
  })
}
