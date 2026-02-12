"use client"

import { Calendar, TrendingUp, CheckCircle2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { Skeleton } from "@/components/ui/skeleton"
import { FINANCIAL } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

/**
 * TodayContribution Component
 * Displays today's savings contribution and daily progress
 */
export function TodayContribution() {
  const { data, loading } = useWallet()

  const dailySavingAmount = data?.dailySavingAmount || FINANCIAL.DAILY_SAVINGS_AMOUNT
  const isContributionMade = data?.lastDailySavingDate
    ? new Date(data.lastDailySavingDate).toDateString() === new Date().toDateString()
    : false

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-emerald-100">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-10 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border transition-all ${isContributionMade
        ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
        : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
      }`}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${isContributionMade ? "bg-emerald-100" : "bg-orange-100"
            }`}>
            <Calendar className={`w-5 h-5 md:w-6 md:h-6 ${isContributionMade ? "text-emerald-600" : "text-orange-600"
              }`} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Today's Contribution
            </p>
            <p className="text-slate-700 text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        {isContributionMade && (
          <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 animate-pulse" />
        )}
      </div>

      <div className="space-y-2 md:space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl md:text-4xl font-bold ${isContributionMade ? "text-emerald-600" : "text-orange-600"
            }`}>
            {formatCurrency(dailySavingAmount)}
          </span>
          <span className="text-slate-600 text-sm md:text-base">saved today</span>
        </div>

        <p className={`text-xs sm:text-sm ${isContributionMade
            ? "text-emerald-700 font-medium"
            : "text-orange-700 font-medium"
          }`}>
          {isContributionMade
            ? "✓ Daily goal completed! Great job keeping your streak alive."
            : "⏳ Daily contribution pending. Don't miss out on your savings goal!"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600">Daily Progress</span>
          <span className="text-xs font-bold text-slate-700">
            {isContributionMade ? "100%" : "0%"}
          </span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${isContributionMade ? "bg-emerald-500 w-full" : "bg-orange-400 w-0"
              }`}
          />
        </div>
      </div>
    </div>
  )
}

