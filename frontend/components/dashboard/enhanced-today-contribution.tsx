/**
 * Enhanced Today Contribution Component
 * Daily savings tracker with visual feedback
 */

'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface TodayContributionProps {
  contributed: boolean
  dailyGoal: number
}

export function EnhancedTodayContribution({ contributed, dailyGoal }: TodayContributionProps) {
  const now = new Date()
  const hours = now.getHours()
  const hoursRemaining = 23 - hours

  return (
    <Card className={`overflow-hidden ${contributed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Today's Contribution</h3>
            <p className="text-sm text-gray-600 mt-1">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {contributed ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600 hover:bg-amber-700">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Goal</p>
            <p className="text-2xl font-bold text-primary mt-1">${dailyGoal.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Status</p>
            <p className={`text-2xl font-bold mt-1 ${contributed ? 'text-green-600' : 'text-amber-600'}`}>
              {contributed ? '100%' : '0%'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Time Left</p>
            <p className="text-2xl font-bold text-brand-green mt-1">{hoursRemaining}h</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={contributed ? 100 : 0} className="h-2" />
        </div>

        {/* Status Message */}
        {contributed && (
          <div className="p-3 bg-white border border-green-200 rounded-lg flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Contribution Complete</p>
              <p className="text-sm text-green-700">
                ${dailyGoal.toFixed(2)} has been saved today. Great job staying consistent!
              </p>
            </div>
          </div>
        )}

        {!contributed && (
          <div className="p-3 bg-white border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Contribution Pending</p>
              <p className="text-sm text-amber-700">
                You have {hoursRemaining} hours to complete today's ${dailyGoal.toFixed(2)} savings goal.
              </p>
            </div>
          </div>
        )}

        {/* Streak Info */}
        <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">
            Contribution Frequency
          </p>
          <p className="text-sm text-gray-700">
            Daily auto-debit at <strong>11:59 PM UTC</strong>
          </p>
        </div>
      </div>
    </Card>
  )
}
