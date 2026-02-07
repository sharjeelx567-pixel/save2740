/**
 * Wallet Limits Component
 * Detailed breakdown of daily/monthly transaction limits
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertCircle,
  Loader2,
  TrendingUp,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Info,
} from 'lucide-react'
import { WalletService } from '@/lib/wallet-service'

const TIER_INFO = {
  unverified: {
    tier: 'Unverified',
    dailyDeposit: 1000,
    monthlyDeposit: 5000,
    dailyWithdrawal: 500,
    monthlyWithdrawal: 2000,
    singleTransaction: 500,
  },
  verified: {
    tier: 'Verified',
    dailyDeposit: 10000,
    monthlyDeposit: 50000,
    dailyWithdrawal: 5000,
    monthlyWithdrawal: 20000,
    singleTransaction: 10000,
  },
  premium: {
    tier: 'Premium',
    dailyDeposit: 50000,
    monthlyDeposit: 500000,
    dailyWithdrawal: 25000,
    monthlyWithdrawal: 100000,
    singleTransaction: 50000,
  },
}

export function WalletLimits() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)

  const [limits, setLimits] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLimits = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await WalletService.getLimits()
        if (response.success && response.data) {
          const limitsData = response.data.data || response.data
          setLimits(limitsData)
        } else {
          throw new Error(response.error?.error || 'Failed to fetch limits')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load limits'
        setError(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLimits()
  }, [toast])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !loading) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load limits</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const dailyLimits = limits?.daily || {}
  const monthlyLimits = limits?.monthly || {}
  const singleTransaction = limits?.singleTransaction || {}

  return (
    <div className="space-y-6">
      {/* Daily Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Limits
          </CardTitle>
          <CardDescription>Your daily transaction limits and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Deposit Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(dailyLimits.deposit?.limit || 0).toLocaleString()}
              </p>
              {dailyLimits.deposit && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium">${(dailyLimits.deposit.used || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-emerald-600">${(dailyLimits.deposit.remaining || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Withdrawal Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(dailyLimits.withdrawal?.limit || 0).toLocaleString()}
              </p>
              {dailyLimits.withdrawal && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium">${(dailyLimits.withdrawal.used || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-emerald-600">${(dailyLimits.withdrawal.remaining || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Limits
          </CardTitle>
          <CardDescription>Your monthly transaction limits and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Deposit Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(monthlyLimits.deposit?.limit || 0).toLocaleString()}
              </p>
              {monthlyLimits.deposit && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium">${(monthlyLimits.deposit.used || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-emerald-600">${(monthlyLimits.deposit.remaining || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Withdrawal Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(monthlyLimits.withdrawal?.limit || 0).toLocaleString()}
              </p>
              {monthlyLimits.withdrawal && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium">${(monthlyLimits.withdrawal.used || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-emerald-600">${(monthlyLimits.withdrawal.remaining || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Single Transaction Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Per-Transaction Limits
          </CardTitle>
          <CardDescription>Minimum and maximum amounts for single transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Min Deposit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(singleTransaction.minDeposit || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Max Deposit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(singleTransaction.maxDeposit || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Min Withdrawal</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(singleTransaction.minWithdrawal || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Max Withdrawal</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(singleTransaction.maxWithdrawal || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert className="bg-green-50 border-green-200">
        <Info className="h-4 w-4 text-brand-green" />
        <AlertDescription className="text-brand-green text-sm">
          <p className="font-semibold mb-1">Limits &amp; Verification</p>
          <p>
            Complete additional account verification to increase your limits and unlock higher tiers.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}


