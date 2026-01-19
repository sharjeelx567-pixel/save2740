"use client"

import { useTransactions } from "@/hooks/use-transactions"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react"

/**
 * PendingFailedTransactions Component
 * Displays pending and failed transactions prominently
 */
export function PendingFailedTransactions() {
  const { data: transactions, loading } = useTransactions()

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const pendingTransactions = transactions?.filter((t) => t.status === "pending") || []
  const failedTransactions = transactions?.filter((t) => t.status === "failed") || []

  if (pendingTransactions.length === 0 && failedTransactions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-brand-green to-cyan-500 px-6 py-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-white animate-spin" />
            <h3 className="text-white font-bold">
              {pendingTransactions.length} Pending Transaction
              {pendingTransactions.length !== 1 ? "s" : ""}
            </h3>
          </div>

          <div className="p-6 space-y-3">
            {pendingTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-100"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Clock className="w-4 h-4 text-brand-green animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-600">
                      {new Date(tx.createdAt).toLocaleDateString()} •{" "}
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">
                    {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-brand-green font-semibold">
                    Processing...
                  </p>
                </div>
              </div>
            ))}

            <div className="bg-green-100 rounded-lg p-3 text-sm text-slate-900">
              ⏳ Transactions typically complete within 1-3 business days.
            </div>
          </div>
        </div>
      )}

      {/* Failed Transactions */}
      {failedTransactions.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold">
              {failedTransactions.length} Failed Transaction
              {failedTransactions.length !== 1 ? "s" : ""}
            </h3>
          </div>

          <div className="p-6 space-y-3">
            {failedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-100"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-600">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">
                    {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-red-600 font-semibold">Failed</p>
                </div>
              </div>
            ))}

            <button className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg text-sm transition-colors">
              🔄 Retry Failed Transactions
            </button>

            <div className="bg-red-100 rounded-lg p-3 text-sm text-red-900">
              ❌ These transactions failed. Try again or contact support for help.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
