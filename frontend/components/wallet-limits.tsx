"use client"

import { AlertCircle, TrendingUp } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { Skeleton } from "@/components/ui/skeleton"

interface WalletLimit {
  type: "daily" | "monthly" | "maximum"
  label: string
  limit: number
  used: number
  period: string
}

/**
 * WalletLimits Component
 * Displays current wallet limits and usage
 */
export function WalletLimits() {
  const { data, loading } = useWallet()

  // Mock limits - these would come from API in production
  const limits: WalletLimit[] = [
    {
      type: "daily",
      label: "Daily Transfer Limit",
      limit: 5000,
      used: data?.balance ? Math.min(data.balance, 2500) : 0,
      period: "Today",
    },
    {
      type: "monthly",
      label: "Monthly Transfer Limit",
      limit: 50000,
      used: data?.balance ? Math.min(data.balance * 0.3, 15000) : 0,
      period: "This Month",
    },
    {
      type: "maximum",
      label: "Maximum Balance",
      limit: 100000,
      used: data?.balance || 0,
      period: "Current",
    },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  const isNearLimit = limits.some((l) => (l.used / l.limit) > 0.8)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-slate-800" />
        <h3 className="text-lg font-bold text-slate-800">Wallet Limits</h3>
        {isNearLimit && (
          <span className="ml-auto px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Approaching Limit
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {limits.map((limit) => {
          const percentage = (limit.used / limit.limit) * 100
          const isApproaching = percentage > 80
          const isExceeded = percentage > 100

          return (
            <div
              key={limit.type}
              className={`rounded-2xl p-5 border-2 transition-all ${
                isExceeded
                  ? "bg-red-50 border-red-200"
                  : isApproaching
                  ? "bg-orange-50 border-orange-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-800">{limit.label}</p>
                <span className="text-xs font-bold text-slate-600 uppercase">
                  {limit.period}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-2xl font-bold text-slate-800">
                    ${limit.used.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  <span className="text-sm text-slate-600">
                    of ${limit.limit.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>

              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    isExceeded
                      ? "bg-red-500"
                      : isApproaching
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
              </div>

              <p className="text-xs text-slate-600 mt-2">
                {isExceeded ? (
                  <span className="text-red-600 font-semibold">
                    ⚠️ Limit exceeded. Contact support.
                  </span>
                ) : isApproaching ? (
                  <span className="text-orange-600 font-semibold">
                    ⚡ {(100 - percentage).toFixed(1)}% remaining
                  </span>
                ) : (
                  <span>
                    {(100 - percentage).toFixed(1)}% remaining of limit
                  </span>
                )}
              </p>
            </div>
          )
        })}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-6">
        <p className="text-sm text-slate-900">
          <span className="font-semibold">💡 Tip:</span> Limits help protect your account.
          To increase limits, complete additional verification or contact our support team.
        </p>
      </div>
    </div>
  )
}

