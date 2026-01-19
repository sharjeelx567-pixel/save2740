"use client"

import { ArrowUp } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { useTransactions } from "@/hooks/use-transactions"
import { FINANCIAL, UI } from "@/lib/constants"
import { BreakdownItem, Deposit } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SavingsBreakdown Component
 * Displays weekly, monthly, YTD savings breakdown and recent deposits
 */
export function SavingsBreakdown() {
  const { data: walletData, loading: walletLoading } = useWallet()
  const { deposits, loading: txLoading } = useTransactions({
    limit: UI.RECENT_DEPOSITS_LIMIT,
  })

  const loading = walletLoading || txLoading
  const balance = walletData?.balance ?? 0

  // Calculate breakdown items
  const calculateBreakdownItems = (): BreakdownItem[] => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const yearStart = new Date(today.getFullYear(), 0, 1)

    const weekSavings = Math.min(
      balance,
      ((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) *
        FINANCIAL.DAILY_SAVINGS_AMOUNT
    )
    const monthSavings = Math.min(
      balance,
      ((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) *
        FINANCIAL.DAILY_SAVINGS_AMOUNT
    )
    const ytdSavings = balance
    const daysInYear = 365
    const daysCompleted = Math.floor(
      (today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    const projectedGoal =
      (daysInYear / Math.max(1, daysCompleted)) * balance

    return [
      {
        label: "This Week",
        value: `$${weekSavings.toFixed(2)}`,
        progress: Math.min(
          100,
          (weekSavings / (FINANCIAL.DAILY_SAVINGS_AMOUNT * 7)) * 100
        ),
      },
      {
        label: "This Month",
        value: `$${monthSavings.toFixed(2)}`,
        progress: Math.min(
          100,
          (monthSavings / (FINANCIAL.DAILY_SAVINGS_AMOUNT * 30)) * 100
        ),
      },
      {
        label: "Year To Date",
        value: `$${ytdSavings.toFixed(2)}`,
        progress: Math.min(
          100,
          (ytdSavings / FINANCIAL.YEARLY_SAVINGS_GOAL) * 100
        ),
      },
      {
        label: "Projected Goal",
        value: `$${projectedGoal.toFixed(2)}`,
        isProjected: true,
      },
    ]
  }

  const breakdownItems = calculateBreakdownItems()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm flex-1 border border-slate-100">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-12">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Format recent deposits for display
  const formattedDeposits: Deposit[] =
    deposits && deposits.length > 0
      ? deposits.map((tx) => ({
          label: tx.description || "Deposit",
          date: new Date(tx.createdAt).toLocaleDateString(),
          amount: `+$${tx.amount.toFixed(2)}`,
        }))
      : []

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm flex-1 border border-slate-100">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h3 className="text-base sm:text-lg md:text-lg font-bold text-slate-800">
          Savings Breakdown
        </h3>
        <button className="text-brand-green text-xs sm:text-sm font-semibold hover:underline transition-colors">
          View Report
        </button>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-12">
        {breakdownItems.map((item) => (
          <div
            key={item.label}
            className="bg-slate-50/50 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {item.label}
            </p>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
                {item.value}
              </p>
              {item.isProjected && (
                <div className="bg-emerald-100 p-1 rounded-md">
                  <ArrowUp className="w-4 h-4 text-brand-green" />
                </div>
              )}
            </div>
            {item.progress !== undefined && (
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-green transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Deposits */}
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-4 md:mb-6 uppercase tracking-wider">
          Recent Deposits
        </h4>
        {formattedDeposits.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {formattedDeposits.map((deposit, idx) => (
              <div key={idx} className="flex items-center justify-between hover:bg-slate-50 p-2 rounded transition-colors gap-2 sm:gap-4">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                    <ArrowUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {deposit.label}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">{deposit.date}</p>
                  </div>
                </div>
                <span className="text-brand-green font-bold text-xs sm:text-sm shrink-0">
                  {deposit.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">No recent deposits</p>
        )}
      </div>
    </div>
  )
}
