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

  useEffect(() => {
    setLoading(false)
  }, [])

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

  const currentTier = TIER_INFO.verified

  return (
    <div className="space-y-6">
      {/* Account Tier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Your current verification tier</CardDescription>
            </div>
            <Badge className="text-lg px-3 py-1 capitalize bg-green-100 text-brand-green">
              verified
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Limits
          </CardTitle>
          <CardDescription>Your daily transaction limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Deposit Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentTier.dailyDeposit.toLocaleString()}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Withdrawal Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentTier.dailyWithdrawal.toLocaleString()}
              </p>
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
          <CardDescription>Your monthly transaction limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Deposit Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentTier.monthlyDeposit.toLocaleString()}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Withdrawal Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentTier.monthlyWithdrawal.toLocaleString()}
              </p>
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
          <CardDescription>Maximum amount for a single transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Max Single Transaction</p>
            <p className="text-3xl font-bold text-gray-900">
              ${currentTier.singleTransaction.toLocaleString()}
            </p>
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

