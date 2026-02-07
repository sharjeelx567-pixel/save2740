"use client"


import { useState } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Download, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTransactions } from "@/hooks/use-transactions"
import { Card, CardContent } from "@/components/ui/card"

function TransactionsPageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const itemsPerPage = 10

  const { data: transactions, loading, error, refetch } = useTransactions({
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  const hasNextPage = transactions && transactions.length === itemsPerPage
  const hasPrevPage = currentPage > 1

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      
      const response = await fetch(`${apiUrl}/api/wallet/transactions/export/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export transactions')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTransactionIcon = (type: string) => {
    return type === 'credit' || type === 'deposit' ? (
      <ArrowDownCircle className="w-5 h-5 text-brand-green" />
    ) : (
      <ArrowUpCircle className="w-5 h-5 text-red-600" />
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-brand-green'
      case 'pending':
        return 'text-orange-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="Transactions" onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">

            <div className="flex justify-end mb-4 md:mb-6">
              <button 
                onClick={handleExportCSV}
                disabled={exporting}
                className="bg-brand-green hover:bg-emerald-600 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl flex items-center gap-2 text-xs md:text-sm font-semibold transition-colors shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                )}
                <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Download CSV'}</span>
                <span className="sm:hidden">{exporting ? '...' : 'Export'}</span>
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
                          <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse ml-auto" />
                        <div className="h-3 bg-slate-200 rounded w-16 animate-pulse ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : error ? (
              /* Error State */
              <Card className="bg-red-50 border-red-200 rounded-2xl md:rounded-3xl">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <AlertCircle className="w-12 h-12 text-red-600 mb-3" />
                  <p className="text-red-800 font-semibold mb-2">Error Loading Transactions</p>
                  <p className="text-red-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={refetch}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </CardContent>
              </Card>
            ) : !transactions || transactions.length === 0 ? (
              /* Empty State */
              <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-8 text-center">
                <p className="text-slate-600 text-lg mb-2">No transactions yet</p>
                <p className="text-slate-400 text-sm">Your transaction history will appear here</p>
              </Card>
            ) : (
              <>
                {/* Transactions Table */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto hide-scrollbar">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider">
                            Transaction
                          </th>
                          <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                            Date
                          </th>
                          <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.map((tx: any, index: number) => (
                          <tr
                            key={tx._id || index}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-3 md:px-6 py-3 md:py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0",
                                  tx.type === 'credit' || tx.type === 'deposit'
                                    ? "bg-emerald-50"
                                    : "bg-red-50"
                                )}>
                                  {getTransactionIcon(tx.type)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs md:text-sm font-semibold text-slate-800 truncate">
                                    {tx.description || 'Transaction'}
                                  </p>
                                  <p className="text-xs text-slate-500 sm:hidden">
                                    {formatDate(tx.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-600 hidden sm:table-cell">
                              {formatDate(tx.createdAt)}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                              <span className={cn(
                                "text-xs md:text-sm font-bold",
                                tx.type === 'credit' || tx.type === 'deposit'
                                  ? "text-brand-green"
                                  : "text-red-600"
                              )}>
                                {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                                ${tx.amount?.toFixed(2) || '0.00'}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                              <span className={cn(
                                "text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded",
                                getStatusColor(tx.status)
                              )}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-100">
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={!hasPrevPage}
                    className={cn(
                      "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors",
                      hasPrevPage
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-slate-50 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  <span className="text-xs md:text-sm text-slate-600 font-medium">
                    Page {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={!hasNextPage}
                    className={cn(
                      "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors",
                      hasNextPage
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-slate-50 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <ProtectedPage>
      <TransactionsPageContent />
    </ProtectedPage>
  )
}

