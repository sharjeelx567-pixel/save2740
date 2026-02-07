"use client"

import { ProtectedPage } from "@/components/protected-page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useWallet } from "@/hooks/use-wallet"
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  XCircle,
  AlertTriangle,
  Wallet as WalletIcon,
  Loader2,
  DollarSign
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface WalletData {
  _id: string
  userId: string
  balance: number
  availableBalance: number
  locked: number
  lockedInPockets: number
  escrowBalance: number
  pendingWithdrawals: number
  status: 'active' | 'frozen' | 'suspended'
  freezeReason?: string
  freezeDate?: string
}

interface Transaction {
  _id: string
  type: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description: string
  createdAt: string
}

interface WalletLimits {
  daily: {
    deposit: { limit: number; used: number; remaining: number }
    withdrawal: { limit: number; used: number; remaining: number }
  }
  monthly: {
    deposit: { limit: number; used: number; remaining: number }
    withdrawal: { limit: number; used: number; remaining: number }
  }
}



function WalletHomePageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Use the optimized useWallet hook (already refactored to useQuery)
  const { data: wallet, loading: walletLoading, refetch: refetchWallet } = useWallet()

  // Fetch limits
  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ['wallet-limits'],
    queryFn: async () => {
      const res = await apiClient.get<WalletLimits>('/api/wallet/limits');
      if (!res.success || !res.data) throw new Error('Failed to fetch limits');
      return res.data;
    },
    staleTime: 60000,
  });

  // Fetch pending transactions
  const { data: pendingTransactions = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['wallet-pending-transactions'],
    queryFn: async () => {
      const res = await apiClient.get<{ transactions: Transaction[] }>('/api/wallet/transactions/pending');
      if (!res.success || !res.data) throw new Error('Failed to fetch pending transactions');
      return res.data.transactions || [];
    },
    staleTime: 10000,
  });

  const loading = walletLoading || limitsLoading || pendingLoading;

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
        </main>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600">Failed to load wallet data</p>
          </div>
        </main>
      </div>
    )
  }

  const isFrozen = wallet.status === 'frozen' || wallet.status === 'suspended'

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="Wallet" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Wallet Freeze Notice */}
            {isFrozen && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-1">
                        Wallet {wallet.status === 'frozen' ? 'Frozen' : 'Suspended'}
                      </h3>
                      <p className="text-sm text-red-700">
                        {wallet.freezeReason || 'Your wallet has been frozen. Please contact support.'}
                      </p>
                      {wallet.freezeDate && (
                        <p className="text-xs text-red-600 mt-1">
                          Frozen on: {new Date(wallet.freezeDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Balance Card */}
            <Card className="bg-gradient-to-br from-brand-green/10 to-brand-green/5 border-brand-green/20">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-medium text-slate-600 mb-1">Total Balance</h2>
                    <p className="text-4xl sm:text-5xl font-bold text-brand-green">
                      ${wallet.balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <WalletIcon className="h-16 w-16 text-brand-green/20" />
                  </div>
                </div>

                {/* Balance Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-brand-green/20">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Available</p>
                    <p className="text-lg font-semibold text-slate-900">
                      ${wallet.availableBalance.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Locked</p>
                    <p className="text-lg font-semibold text-slate-900">
                      ${wallet.locked.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">In Pockets</p>
                    <p className="text-lg font-semibold text-slate-900">
                      ${wallet.lockedInPockets.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Escrow</p>
                    <p className="text-lg font-semibold text-slate-900">
                      ${(wallet.escrowBalance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Link href="/add-money">
                    <Button
                      className="w-full bg-brand-green hover:bg-brand-green/90"
                      disabled={isFrozen}
                    >
                      <ArrowDownLeft className="h-4 w-4 mr-2" />
                      Add Money
                    </Button>
                  </Link>
                  <Link href="/withdrawal">
                    <Button
                      variant="outline"
                      className="w-full border-brand-green text-brand-green hover:bg-brand-green/10"
                      disabled={isFrozen || wallet.availableBalance < 10}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Transactions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Pending</h3>
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-2">
                    {pendingTransactions.length}
                  </p>
                  <Link href="/wallet-transactions?status=pending">
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      View All
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Wallet Limits */}
              {limits && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">Daily Limits</h3>
                      <DollarSign className="h-5 w-5 text-brand-green" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Deposit</span>
                        <span className="font-medium">
                          ${limits.daily.deposit.used.toFixed(2)} / ${limits.daily.deposit.limit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Withdrawal</span>
                        <span className="font-medium">
                          ${limits.daily.withdrawal.used.toFixed(2)} / ${limits.daily.withdrawal.limit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Link href="/wallet-transactions">
                      <Button variant="ghost" size="sm" className="w-full mt-4">
                        View Limits
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Quick Links</h3>
                    <TrendingUp className="h-5 w-5 text-brand-green" />
                  </div>
                  <div className="space-y-2">
                    <Link href="/wallet-transactions">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        Transaction History
                      </Button>
                    </Link>
                    <Link href="/wallet-transactions?status=failed">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        Failed Transactions
                      </Button>
                    </Link>
                    <Link href="/payment-methods">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        Payment Methods
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Transactions List */}
            {pendingTransactions.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Pending Transactions</h3>
                    <Link href="/wallet-transactions?status=pending">
                      <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {pendingTransactions.slice(0, 5).map((tx) => (
                      <div key={tx._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                            <p className="text-xs text-slate-600">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                          {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WalletPage() {
  return (
    <ProtectedPage>
      <WalletHomePageContent />
    </ProtectedPage>
  )
}

