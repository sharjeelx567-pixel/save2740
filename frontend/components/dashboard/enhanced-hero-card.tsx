/**
 * Enhanced Hero Card Component
 * Main savings goal progress display with dynamic visualization
 */

'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Target } from 'lucide-react'

interface HeroCardProps {
  balance: number
  goal: number
  progress: number
}

export function HeroCard({ balance, goal, progress }: HeroCardProps) {
  const remaining = goal - balance
  const daysToGoal = remaining > 0 ? Math.ceil(remaining / 27.40) : 0
  const estimatedDate = new Date()
  estimatedDate.setDate(estimatedDate.getDate() + daysToGoal)

  const progressColor = 
    progress >= 100 ? 'text-green-600' :
    progress >= 75 ? 'text-brand-green' :
    progress >= 50 ? 'text-purple-600' :
    'text-primary'

  const progressBgColor =
    progress >= 100 ? 'bg-green-100' :
    progress >= 75 ? 'bg-green-100' :
    progress >= 50 ? 'bg-purple-100' :
    'bg-primary/10'

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Save2740 Goal
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className={`p-4 rounded-full ${progressBgColor}`}>
            <Target className={`h-8 w-8 ${progressColor}`} />
          </div>
        </div>

        {/* Progress Circle with Percentage */}
        <div className="flex items-center gap-8">
          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24">
              {/* Background circle */}
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${progress * 2.83} 283`}
                  className={progressColor}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${progressColor}`}>
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Goal Info */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Goal Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${goal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Remaining</p>
              <p className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {remaining > 0 ? `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Goal Reached! 🎉'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 font-medium">Annual Progress</span>
            <span className="text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-3" />
        </div>

        {/* Projection Info */}
        {remaining > 0 && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-white/50 rounded-lg border border-primary/10">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Days to Goal
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {daysToGoal}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Estimated Date
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {estimatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* Achievement Badge */}
        {progress >= 100 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-900">Goal Achieved!</p>
                <p className="text-sm text-green-700">
                  You've reached your $27,400 savings goal. Congratulations! 🎉
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
