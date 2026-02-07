"use client"

import Link from "next/link"
import { Wallet, Lock, Gift } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface WalletBalanceProps {
  compact?: boolean
}

/**
 * WalletBalance Component
 * Displays wallet balance information with available, locked, and referral balances
 * Supports both compact and full card modes
 */
export function WalletBalance({ compact = false }: WalletBalanceProps) {
  const { data, balance, locked, referral, loading } = useWallet()

  if (compact) {
    if (loading) {
      return (
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-brand-green" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-32 mt-2" />
        </div>
      )
    }

    return (
      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-brand-green" />
          <span className="text-xs font-semibold text-slate-700">Wallet Balance</span>
        </div>
        <p className="text-lg sm:text-xl font-bold text-brand-green">${balance.toFixed(2)}</p>
        <p className="text-xs text-slate-600 mt-1">Available to use</p>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-6" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = balance + locked + referral

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800">Wallet</h3>
          <Wallet className="w-6 h-6 text-brand-green" />
        </div>

        <div className="space-y-4">
          {/* Available Balance */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Available Balance</span>
              <Wallet className="w-4 h-4 text-brand-green" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-brand-green">${balance.toFixed(2)}</p>
            <p className="text-xs text-slate-600 mt-2">Ready to spend or withdraw</p>
          </div>

          {/* Locked Balance */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Locked Balance</span>
              <Lock className="w-4 h-4 text-brand-green" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-brand-green">${locked.toFixed(2)}</p>
            <p className="text-xs text-slate-600 mt-2">Committed to Saver Pockets</p>
          </div>

          {/* Referral Earnings */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Referral Earnings</span>
              <Gift className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600">${referral.toFixed(2)}</p>
            <p className="text-xs text-slate-600 mt-2">From successful referrals</p>
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total Balance</span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">${total.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Link href="/add-money" className="flex-1">
              <button className="w-full bg-brand-green text-white py-2 sm:py-2.5 rounded-lg font-medium hover:bg-brand-green/90 transition-colors text-sm sm:text-base">
                Top Up Wallet
              </button>
            </Link>
            <button className="flex-1 border border-slate-300 text-slate-700 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm sm:text-base">
              Withdraw
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


