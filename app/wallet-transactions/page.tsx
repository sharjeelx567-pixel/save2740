"use client"

import { ProtectedPage } from "@/components/protected-page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState } from "react"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Transaction {
  id: string
  description: string
  transactionId: string
  bank: string
  date: string
  amount: number | null
  status: "Completed" | "Failed"
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    description: "Daily Auto-Save",
    transactionId: "#12548796",
    bank: "1234 ****",
    date: "19 Jan 2026",
    amount: 27.40,
    status: "Completed",
  },
  {
    id: "2",
    description: "Daily Auto-Save",
    transactionId: "#12548796",
    bank: "1234 ****",
    date: "18 Jan 2026",
    amount: 27.40,
    status: "Completed",
  },
  {
    id: "3",
    description: "Daily Auto-Save",
    transactionId: "#12548796",
    bank: "1234 ****",
    date: "17 Jan 2026",
    amount: null,
    status: "Failed",
  },
  {
    id: "4",
    description: "Daily Auto-Save",
    transactionId: "#12548796",
    bank: "1234 ****",
    date: "16 Jan 2026",
    amount: 27.40,
    status: "Completed",
  },
  {
    id: "5",
    description: "Daily Auto-Save",
    transactionId: "#12548796",
    bank: "1234 ****",
    date: "15 Jan 2026",
    amount: 27.40,
    status: "Completed",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-600 border border-emerald-600"
    case "Failed":
      return "bg-red-50 text-red-600 border border-red-600"
    default:
      return ""
  }
}

function WalletTransactionsPageContent() {
  const [transactions] = useState(MOCK_TRANSACTIONS)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleExport = () => {
    const csv = [
      ["Description", "Transaction ID", "Bank", "Date", "Amount", "Status"],
      ...transactions.map((t) => [
        t.description,
        t.transactionId,
        t.bank,
        t.date,
        t.amount ? `+$${t.amount.toFixed(2)}` : "-",
        t.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "wallet-transactions.csv"
    a.click()
  }

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
        <DashboardHeader title="Transactions" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Export CSV Button */}
            <div className="flex justify-end mb-4 sm:mb-6 animate-fade-in px-2 sm:px-0" style={{ animationDelay: "0.1s" }}>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green/90 hover:shadow-md transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>

            {/* Transactions Table */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-0">
                <div className="overflow-x-auto hide-scrollbar -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px] sm:min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Description</th>
                        <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Trans ID</th>
                        <th className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Bank</th>
                        <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Date</th>
                        <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Amount</th>
                        <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.map((transaction, index) => (
                        <tr
                          key={transaction.id}
                          className="bg-white hover:bg-slate-50 transition-colors duration-150 animate-fade-in"
                          style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                        >
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition-colors">
                                <svg
                                  className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                  />
                                </svg>
                              </div>
                              <span className="text-xs sm:text-sm text-slate-900">{transaction.description}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                            <span className="text-xs sm:text-sm text-slate-900 truncate">{transaction.transactionId}</span>
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                            <span className="text-xs sm:text-sm text-slate-900">{transaction.bank}</span>
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                            <span className="text-xs sm:text-sm text-slate-900">{transaction.date}</span>
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                            {transaction.amount ? (
                              <span className="text-xs sm:text-sm font-semibold text-emerald-600">
                                +${transaction.amount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-xs font-medium transition-all duration-200 whitespace-nowrap ${getStatusColor(
                                transaction.status
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center sm:justify-end gap-0.5 sm:gap-2 px-1 sm:px-4 md:px-6 py-2 sm:py-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-0.5 px-1.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-brand-green font-medium hover:bg-emerald-50 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap flex-shrink-0"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {[1, 2, 3, 4].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${currentPage === page
                        ? "bg-brand-green text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(4, prev + 1))}
                    disabled={currentPage === 4}
                    className="flex items-center gap-0.5 px-1.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-brand-green font-medium hover:bg-emerald-50 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WalletTransactionsPage() {
  return (
    <ProtectedPage>
      <WalletTransactionsPageContent />
    </ProtectedPage>
  )
}
