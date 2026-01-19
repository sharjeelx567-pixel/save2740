/**
 * Dashboard Container Component
 * Main orchestrator for all dashboard views and state management
 * Connects to real backend API for live data
 */

'use client'

import React, { useState, useEffect } from 'react'
import { DashboardAPI, DashboardStats, StreakInfo, ContributionStatus } from '@/lib/dashboard-api'
import dynamic from 'next/dynamic'
import { Loader2, AlertCircle } from 'lucide-react'

// Lazy load heavy components with skeletons
const HeroCard = dynamic(() => import('./enhanced-hero-card').then(mod => mod.HeroCard), {
  loading: () => <div className="w-full h-[300px] bg-slate-100/50 animate-pulse rounded-3xl" />,
  ssr: false
})
const EnhancedStatCards = dynamic(() => import('./enhanced-stat-cards').then(mod => mod.EnhancedStatCards), {
  loading: () => <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[120px] bg-slate-100/50 animate-pulse rounded-xl" />,
  ssr: false
})
const EnhancedTodayContribution = dynamic(() => import('./enhanced-today-contribution').then(mod => mod.EnhancedTodayContribution), {
  loading: () => <div className="w-full h-[200px] bg-slate-100/50 animate-pulse rounded-3xl" />,
  ssr: false
})

interface DashboardContainerProps {
  userId?: string
  goalAmount?: number
}

export function DashboardContainer({ userId, goalAmount = 27400 }: DashboardContainerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [streak, setStreak] = useState<StreakInfo | null>(null)
  const [todayContribution, setTodayContribution] = useState<ContributionStatus | null>(null)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use overview endpoint for optimized single request
      const response = await DashboardAPI.getOverview()

      if (response.success && response.data) {
        setStats(response.data.stats)
        setStreak(response.data.streak)
        setTodayContribution(response.data.todayContribution)
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (err) {
      console.error('[DashboardContainer] Error fetching dashboard data:', err)
      setError('Error loading dashboard. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-green mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-800 font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // No data state
  if (!stats) {
    return (
      <div className="rounded-lg bg-amber-50 p-6 text-center border border-amber-200">
        <p className="text-amber-800">No dashboard data available. Start saving to see your progress!</p>
      </div>
    )
  }

  // Calculate values for components
  const currentBalance = stats.currentBalance / 100 // Convert cents to dollars
  const yearlyGoal = stats.yearlyGoal / 100
  const progress = (currentBalance / yearlyGoal) * 100

  return (
    <div className="space-y-6 py-6">
      {/* Hero Card - Main Progress Display */}
      <HeroCard
        balance={currentBalance}
        goal={yearlyGoal}
        progress={progress}
      />

      {/* Stat Cards - Key Metrics */}
      <EnhancedStatCards
        totalSaved={currentBalance}
        goal={yearlyGoal}
        progress={progress}
      />

      {/* Today's Contribution */}
      <EnhancedTodayContribution
        contributed={todayContribution?.contributed || false}
        dailyGoal={27.40}
      />

      {/* Streak Information Card */}
      {streak && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Savings Streak</h3>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              <span className="text-2xl font-bold text-purple-600">{streak.currentStreak} days</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Current Streak</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{streak.currentStreak}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Longest Streak</p>
              <p className="text-2xl font-bold text-brand-green mt-1">{streak.longestStreak}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">This Month</p>
              <p className="text-2xl font-bold text-primary mt-1">{streak.consistencyPercentage.toFixed(0)}%</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Missed Days</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{streak.missedDaysThisMonth}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Milestone Card */}
      {stats.nextMilestone && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Next Milestone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reach ${(stats.nextMilestone.amount / 100).toLocaleString()}</p>
              <p className="text-3xl font-bold text-green-600">
                ${(stats.nextMilestone.remaining / 100).toLocaleString()} to go
              </p>
            </div>
            <div className="text-6xl">🎯</div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                style={{
                  width: `${((stats.currentBalance / stats.nextMilestone.amount) * 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Active Plans</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activePlansCount}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Days Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.daysActive}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Avg Daily Savings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${(stats.avgDailySavings / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
