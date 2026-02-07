"use client"


import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedPage } from "@/components/protected-page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { CheckCircle2, Wallet, ArrowUp, Download, Loader2 } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { useTransactions } from "@/hooks/use-transactions"
import { WalletFreezeNotice } from "@/components/wallet-freeze-notice"
import { WalletLimits } from "@/components/wallet-limits"
import { PendingFailedTransactions } from "@/components/pending-failed-transactions"
import { TransactionNotificationContainer } from "@/components/transaction-notification"
import { AddMoneyModal } from "@/components/wallet/add-money-modal"
import { WithdrawModal } from "@/components/wallet/withdraw-modal"

function MyWalletPageContent() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)

  const { data: walletData, loading: walletLoading, refetch: refetchWallet } = useWallet()
  const { data: transactions, loading: txLoading, refetch: refetchTx } = useTransactions({ limit: 10 })

  const balance = walletData?.balance ?? 0
  const locked = walletData?.locked ?? 0
  const referral = walletData?.referral ?? 0
  const availableBalance = walletData?.availableBalance ?? (balance - locked)

  const handleSuccess = () => {
    refetchWallet()
    refetchTx()
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* ... keeping sidebar ... */}

      {/* Add Modals */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        onSuccess={handleSuccess}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={handleSuccess}
        availableBalance={balance - locked}
      />

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

      {/* Transaction Notifications */}
      <TransactionNotificationContainer />

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="My Wallet" onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">

            {/* Wallet Freeze Notice (if frozen) */}
            <WalletFreezeNotice />

            {/* Pending & Failed Transactions Alert */}
            <PendingFailedTransactions />

            {/* Identity Verification Alert */}
            <Card className="border-2 border-emerald-200 bg-emerald-50 rounded-2xl md:rounded-3xl overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-brand-green shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">Identity Verification Required</h3>
                    <p className="text-sm md:text-base text-slate-600 mb-4">
                      To enable wallet features and comply with financial regulations, please verify your identity.
                    </p>
                    <button
                      onClick={() => router.push('/profile')}
                      className="bg-brand-green hover:bg-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold flex items-center gap-2 transition-colors text-xs sm:text-sm md:text-base"
                    >
                      <CheckCircle2 className="w-3 h-3 sm:w-4 md:w-4 sm:h-4 md:h-4" />
                      <span className="hidden sm:inline">Start KYC Verification</span>
                      <span className="sm:hidden">Start KYC</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Wallet Balance Card */}
              <div className="lg:col-span-1">
                <Card className="bg-[#1E293B] border-none rounded-2xl md:rounded-3xl overflow-hidden h-full">
                  <CardContent className="p-4 sm:p-6 md:p-8 text-white flex flex-col justify-between h-full">
                    {walletLoading ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-4 w-32 bg-slate-700/50 rounded" />
                        <div className="h-12 w-48 bg-slate-700/50 rounded" />
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-slate-700/50 rounded" />
                          <div className="h-4 w-full bg-slate-700/50 rounded" />
                          <div className="h-4 w-full bg-slate-700/50 rounded" />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-slate-400 text-xs sm:text-sm md:text-base">Total Wallet Balance</p>
                          <button
                            onClick={async () => {
                              try {
                                toast.loading("Syncing wallet...");
                                await apiClient.post('/api/wallet/sync');
                                await refetchWallet();
                                toast.success("Wallet synced!");
                              } catch (e) { toast.error("Sync failed"); }
                            }}
                            className="text-xs text-brand-green hover:underline flex items-center gap-1"
                          >
                            <Loader2 className="w-3 h-3" /> Sync
                          </button>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">${balance.toFixed(2)}</h2>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Available:</span>
                            <span className="font-semibold">${availableBalance.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Locked:</span>
                            <span className="font-semibold text-orange-400">${locked.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Referral:</span>
                            <span className="font-semibold text-emerald-400">${referral.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 mt-6">
                      <button
                        onClick={() => setIsAddMoneyOpen(true)}
                        className="w-full bg-brand-green hover:bg-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
                      >
                        <ArrowUp className="w-4 h-4" />
                        Add Money
                      </button>
                      <button
                        onClick={() => setIsWithdrawOpen(true)}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
                      >
                        <Download className="w-4 h-4" />
                        Withdraw
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Limits & About */}
              <div className="lg:col-span-2">
                <div className="space-y-6 md:space-y-8">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-white border border-slate-100 rounded-2xl">
                      <CardContent className="p-4 md:p-6">
                        <h4 className="text-xs md:text-sm text-slate-600 font-semibold uppercase mb-2">Prepaid for Success</h4>
                        <p className="text-xs md:text-sm text-slate-600">
                          Use wallet funds to pay for challenge fees and subscriptions.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-100 rounded-2xl">
                      <CardContent className="p-4 md:p-6">
                        <h4 className="text-xs md:text-sm text-slate-600 font-semibold uppercase mb-2">Secure & Regulated</h4>
                        <p className="text-xs md:text-sm text-slate-600">
                          KYC ensures compliance and protects your account.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Limits */}
            <WalletLimits />

            {/* Recent Transactions */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-bold text-slate-800">Recent Transactions</h3>
                <button className="text-brand-green text-sm font-semibold hover:underline flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  View All
                </button>
              </div>

              {txLoading ? (
                <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-6">
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={`skeleton-${i}`} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </Card>
              ) : transactions && transactions.length > 0 ? (
                <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {transactions && transactions.map((tx: any, index: number) => (
                        <div
                          key={tx.id || `wallet-tx-${index}`}
                          className="p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                            <div className={`w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' || tx.type === 'deposit'
                              ? 'bg-emerald-50'
                              : 'bg-red-50'
                              }`}>
                              {tx.type === 'credit' || tx.type === 'deposit' ? '✓' : '✗'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm md:text-base font-semibold text-slate-800 truncate">{tx.description}</p>
                              <p className="text-xs md:text-sm text-slate-500">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-auto sm:ml-0">
                            <p className={`text-base sm:text-sm md:text-base font-bold ${tx.type === 'credit' || tx.type === 'deposit'
                              ? 'text-emerald-600'
                              : 'text-red-600'
                              }`}>
                              {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </p>
                            <p className={`text-xs font-semibold ${tx.status === 'completed'
                              ? 'text-emerald-600'
                              : tx.status === 'pending'
                                ? 'text-orange-600'
                                : 'text-red-600'
                              }`}>
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-6 text-center">
                  <p className="text-slate-600">No transactions yet. Add money to get started!</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function MyWalletPage() {
  return (
    <ProtectedPage>
      <MyWalletPageContent />
    </ProtectedPage>
  )
}



