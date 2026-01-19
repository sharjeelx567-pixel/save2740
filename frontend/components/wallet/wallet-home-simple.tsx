/**
 * Wallet Home Component
 * Main wallet dashboard with balance and quick actions
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWallet } from '@/hooks/use-wallet'
import { Loader2, ArrowUpRight, ArrowDownLeft, TrendingUp, AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

export function WalletHome() {
  const { toast } = useToast()
  const { data: wallet, loading: walletLoading, error: walletError } = useWallet()

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (walletError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load wallet data. Please try again.</AlertDescription>
      </Alert>
    )
  }

  if (!wallet) return null

  const balance = wallet?.balance ?? 0

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Your available funds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Balance</p>
            <p className="text-4xl font-bold text-primary">
              ${balance.toFixed(2)}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Link href="/wallet/add-money">
              <Button className="w-full">
                <ArrowDownLeft className="h-4 w-4 mr-2" />
                Add Money
              </Button>
            </Link>
            <Link href="/wallet/withdraw">
              <Button
                variant="outline"
                className="w-full"
                disabled={balance < 10}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </Link>
          </div>

          {/* View Transactions */}
          <Link href="/wallet/transactions">
            <Button variant="ghost" className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Transactions
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
