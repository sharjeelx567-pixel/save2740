"use client"

import { CircleDollarSign, Target, CalendarDays, Hourglass } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { FINANCIAL } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"

interface StatItem {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  bgColor: string
}

/**
 * StatCards Component
 * Displays key financial metrics: total saved, remaining goal, days completed, days remaining
 */
export function StatCards() {
  const { balance, loading } = useWallet()

  const today = new Date()
  const yearStart = new Date(today.getFullYear(), 0, 1)
  const daysInYear = 365
  const daysCompleted = Math.floor(
    (today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysRemaining = daysInYear - daysCompleted
  const remainingGoal = Math.max(0, FINANCIAL.YEARLY_SAVINGS_GOAL - balance)

  const stats: StatItem[] = [
    {
      label: "Total Saved",
      value: `$${balance.toFixed(2)}`,
      icon: CircleDollarSign,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      label: "Remaining Goal",
      value: `$${remainingGoal.toFixed(2)}`,
      icon: Target,
      iconColor: "text-brand-green",
      bgColor: "bg-green-50",
    },
    {
      label: "Days Completed",
      value: daysCompleted.toString(),
      icon: CalendarDays,
      iconColor: "text-pink-500",
      bgColor: "bg-pink-50",
    },
    {
      label: "Days Remaining",
      value: daysRemaining.toString(),
      icon: Hourglass,
      iconColor: "text-teal-500",
      bgColor: "bg-teal-50",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center md:gap-4 gap-3 shadow-sm border border-slate-100"
          >
            <Skeleton className="w-12 h-12 rounded-lg md:rounded-2xl shrink-0" />
            <div className="text-center md:text-left w-full">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card-hover bg-white p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center md:gap-4 gap-3 shadow-sm border border-slate-100 cursor-pointer"
        >
          <div className={`${stat.bgColor} p-2 sm:p-3 rounded-lg md:rounded-2xl shrink-0`}>
            <stat.icon
              className={`w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ${stat.iconColor}`}
            />
          </div>
          <div className="text-center md:text-left w-full min-w-0">
            <p className="text-slate-500 text-xs sm:text-xs md:text-sm font-medium truncate">
              {stat.label}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 break-words">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}


