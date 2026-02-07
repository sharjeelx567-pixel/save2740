"use client"

import { useState, useEffect } from "react"
import { Flame, X, Calendar, Clock, TrendingUp } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { AddMoneyModal } from "@/components/wallet/add-money-modal"
import { FINANCIAL } from "@/lib/constants"

/**
 * MissedDayWarning Component
 * Shows alert when user hasn't made their daily savings contribution
 */
export function MissedDayWarning() {
  const { data, refetch } = useWallet()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)

  useEffect(() => {
    if (!data || isDismissed) {
      setIsVisible(false)
      return
    }

    const lastSavingDate = data.lastDailySavingDate
      ? new Date(data.lastDailySavingDate)
      : null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastDate = lastSavingDate
      ? new Date(lastSavingDate)
      : new Date(today.getTime() - 24 * 60 * 60 * 1000)

    lastDate.setHours(0, 0, 0, 0)

    const isMissed = today.getTime() > lastDate.getTime()

    setIsVisible(isMissed)
  }, [data, isDismissed])

  if (!isVisible) return null

  const hoursLeft = 24 - new Date().getHours()
  const dailyAmount = data?.dailySavingAmount || FINANCIAL.DAILY_SAVINGS_AMOUNT

  const handleSuccess = () => {
    refetch()
    // Optional: Dismiss the warning after successful deposit
    // setIsDismissed(true)
  }

  return (
    <>
      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-md z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base lg:text-lg leading-tight">
                    Keep Your Streak Alive!
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-0.5 sm:mt-1">
                    You haven't saved today yet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 sm:p-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Streak */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-orange-200/50">
                <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />
                  <span className="text-xs sm:text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Streak
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600 leading-none">
                  {data?.currentStreak || 0}
                </p>
                <p className="text-xs sm:text-xs text-slate-600 mt-1">days</p>
              </div>

              {/* Time Left */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-amber-200/50">
                <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                  <span className="text-xs sm:text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Time
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600 leading-none">{hoursLeft}</p>
                <p className="text-xs sm:text-xs text-slate-600 mt-1">hours</p>
              </div>

              {/* Goal */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-emerald-200/50">
                <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-green" />
                  <span className="text-xs sm:text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Goal
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-brand-green leading-none">
                  ${dailyAmount.toFixed(0)}
                </p>
                <p className="text-xs sm:text-xs text-slate-600 mt-1">today</p>
              </div>
            </div>

            {/* Amount Highlight */}
            <div className="bg-gradient-to-br from-brand-green to-emerald-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm font-semibold text-white/90 mb-1">
                Daily Savings Amount
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-white mb-1">
                ${dailyAmount.toFixed(2)}
              </p>
              <p className="text-xs sm:text-xs text-white/80">
                Save now to maintain your streak
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={() => setShowDepositModal(true)}
              className="w-full bg-brand-green hover:bg-emerald-600 text-white font-semibold py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              Contribute Now
            </button>

            {/* Encouragement */}
            <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-2.5 sm:p-3">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-xs text-slate-600 leading-relaxed">
                Don't let your progress slip away! Keep your streak alive and stay on track with your savings goal.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AddMoneyModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleSuccess}
        initialAmount={dailyAmount}
      />
    </>
  )
}

