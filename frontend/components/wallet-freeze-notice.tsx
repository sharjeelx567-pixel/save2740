"use client"

import { AlertTriangle, Lock } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

/**
 * WalletFreezeNotice Component
 * Displays when wallet is frozen due to security or compliance issues
 */
export function WalletFreezeNotice() {
  const { data } = useWallet()

  // This would come from API in production
  const isFrozen = false // data?.accountStatus === "frozen"
  const freezeReason = "Suspected fraudulent activity detected"
  const unfreezeDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()

  if (!isFrozen) return null

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-full">
          <Lock className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-900 mb-2">
            ⚠️ Your Wallet Has Been Frozen
          </h3>
          <p className="text-red-800 text-sm mb-4">
            {freezeReason}
          </p>
          <div className="bg-white rounded-lg p-4 mb-4 border border-red-200">
            <p className="text-sm text-slate-700 mb-2">
              <span className="font-semibold">Expected to be unfrozen:</span> {unfreezeDate}
            </p>
            <p className="text-xs text-slate-600">
              This is a temporary security measure. Your funds are safe and will be accessible soon.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
              Appeal Decision
            </button>
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
