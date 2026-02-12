/**
 * Enhanced Stat Cards Component
 * Key metrics display with real-time updates
 */

'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, Target, Calendar, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StatCardsProps {
  totalSaved: number
  goal: number
  progress: number
}

export function EnhancedStatCards({ totalSaved, goal, progress }: StatCardsProps) {
  const remaining = goal - totalSaved
  const dailyRate = 27.40
  const weeklySavings = dailyRate * 7
  const monthlySavings = dailyRate * 30
  const daysCompleted = Math.floor(totalSaved / dailyRate)
  const daysRemainingInYear = 365 - daysCompleted

  const stats = [
    {
      label: 'Total Saved',
      value: formatCurrency(totalSaved),
      subtext: `${Math.round(progress)}% of goal`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Goal Amount',
      value: formatCurrency(goal),
      subtext: `${formatCurrency(remaining)} remaining`,
      icon: Target,
      color: 'text-brand-green',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Monthly Rate',
      value: formatCurrency(monthlySavings),
      subtext: `${formatCurrency(dailyRate)} daily × 30 days`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Progress',
      value: `${Math.round(progress)}%`,
      subtext: `${daysCompleted} days completed`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className={`${stat.bgColor} border-none`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  {stat.label}
                </p>
                <div className={`p-2 rounded-lg bg-white`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>

              <div>
                <p className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-600">
                  {stat.subtext}
                </p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

