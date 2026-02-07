"use client"

import { Flame, Calendar, Target, TrendingUp } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { Skeleton } from "@/components/ui/skeleton"
import { FINANCIAL } from "@/lib/constants"

/**
 * SavingsStreakScreen Component
 * Displays user's savings streak and streak statistics
 */
export function SavingsStreakScreen() {
  const { data, loading } = useWallet()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-slate-100">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const currentStreak = data?.currentStreak || 0
  const dailyAmount = data?.dailySavingAmount || FINANCIAL.DAILY_SAVINGS_AMOUNT
  const balance = data?.balance || 0

  // Calculate projections
  const daysInYear = 365
  const today = new Date()
  const yearStart = new Date(today.getFullYear(), 0, 1)
  const daysCompleted = Math.floor(
    (today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  const remainingDays = daysInYear - daysCompleted
  const projectedTotal = balance + dailyAmount * remainingDays
  const yearlyGoal = FINANCIAL.YEARLY_SAVINGS_GOAL

  // Streak milestones
  const streakMilestones = [
    { days: 7, label: "Week Warrior", emoji: "⚔️" },
    { days: 30, label: "Monthly Master", emoji: "📅" },
    { days: 100, label: "Century Club", emoji: "💯" },
    { days: 365, label: "Year Legend", emoji: "👑" },
  ]

  const nextMilestone = streakMilestones.find((m) => m.days > currentStreak)

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Main Streak Card */}
      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-orange-200 overflow-hidden relative">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-200 rounded-full">
              <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                Your Savings Streak
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Keep the momentum going!
              </p>
            </div>
          </div>

          {/* Big streak number */}
          <div className="text-center py-8 md:py-12">
            <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 mb-3">
              {currentStreak}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
              Days Strong
            </p>
            <p className="text-sm sm:text-base text-slate-600">
              {currentStreak === 0
                ? "Start your streak today!"
                : currentStreak === 1
                ? "Great start! Keep it going."
                : `You're on a roll! Don't break it.`}
            </p>
          </div>

          {/* Next milestone */}
          {nextMilestone && (
            <div className="bg-white rounded-xl p-4 border border-orange-100">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Next Milestone
              </p>
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl">{nextMilestone.emoji}</div>
                <div>
                  <p className="font-bold text-slate-800">{nextMilestone.label}</p>
                  <p className="text-sm text-slate-600">
                    {nextMilestone.days - currentStreak} days away
                  </p>
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                  style={{
                    width: `${(currentStreak / nextMilestone.days) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {/* Daily Amount */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-100 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600 uppercase">
              Daily Amount
            </p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            ${dailyAmount.toFixed(2)}
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Per day to maintain streak
          </p>
        </div>

        {/* Current Progress */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-brand-green" />
            </div>
            <p className="text-sm font-semibold text-slate-600 uppercase">
              Saved This Year
            </p>
          </div>
          <p className="text-3xl font-bold text-brand-green">
            ${balance.toFixed(2)}
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {((balance / yearlyGoal) * 100).toFixed(1)}% of annual goal
          </p>
        </div>

        {/* Days Completed */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600 uppercase">
              Days Completed
            </p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{daysCompleted}</p>
          <p className="text-xs text-slate-600 mt-2">
            {remainingDays} days left in year
          </p>
        </div>

        {/* Projected Total */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 sm:p-6 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm font-semibold text-slate-700 uppercase">
              Projected by Year End
            </p>
          </div>
          <p className="text-3xl font-bold text-emerald-700">
            ${Math.round(projectedTotal).toLocaleString()}
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {projectedTotal >= yearlyGoal
              ? "🎉 You'll exceed your goal!"
              : `$${(yearlyGoal - projectedTotal).toFixed(2)} short of goal`}
          </p>
        </div>
      </div>

      {/* Streak Tips */}
      <div className="bg-gradient-to-br from-green-50 to-indigo-50 rounded-2xl p-5 sm:p-6 border border-green-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>💡 Streak Tips</span>
        </h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="text-brand-green font-bold">•</span>
            Set up automatic daily transfers to ensure you never miss a day
          </li>
          <li className="flex gap-2">
            <span className="text-brand-green font-bold">•</span>
            Track your progress and celebrate milestones along the way
          </li>
          <li className="flex gap-2">
            <span className="text-brand-green font-bold">•</span>
            Share your streak with friends for extra motivation
          </li>
          <li className="flex gap-2">
            <span className="text-brand-green font-bold">•</span>
            Remember: small consistent actions lead to big results
          </li>
        </ul>
      </div>
    </div>
  )
}

