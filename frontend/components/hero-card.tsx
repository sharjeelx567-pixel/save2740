"use client"

import { useState } from "react"
import { Rocket, CheckCircle2, Loader2, X } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { FINANCIAL } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { WithdrawMoney } from "@/components/wallet/withdraw-money"
import { formatCurrency } from "@/lib/utils"

/**
 * HeroCard Component
 * Displays yearly savings challenge with progress and daily target
 */
export function HeroCard() {
  const { balance, loading, refetch } = useWallet()
  const { toast } = useToast()
  const [showAutoSaveModal, setShowAutoSaveModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [processingAutoSave, setProcessingAutoSave] = useState(false)

  const remaining = Math.max(0, FINANCIAL.YEARLY_SAVINGS_GOAL - balance)
  const progress = Math.min(100, (balance / FINANCIAL.YEARLY_SAVINGS_GOAL) * 100)
  const dailyTarget = (remaining / 365).toFixed(2)
  const dailyAmount = FINANCIAL.DAILY_SAVINGS_AMOUNT

  const handleAutoSave = async () => {
    setProcessingAutoSave(true)
    try {
      // Process daily contribution
      const response = await fetch('/api/daily-savings/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          amount: dailyAmount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success!',
          description: `Successfully saved ${formatCurrency(dailyAmount)} today. Keep your streak alive!`,
        })
        setShowAutoSaveModal(false)
        refetch() // Refresh wallet data
      } else {
        throw new Error(data.error || 'Failed to process auto-save')
      }
    } catch (error) {
      console.error('Auto-save error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process auto-save. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setProcessingAutoSave(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1E293B] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row justify-between items-center lg:items-start text-white overflow-hidden relative mb-6 md:mb-8 gap-6 md:gap-8">
        <div className="space-y-4 sm:space-y-5 md:space-y-6 relative z-10 flex-1 w-full lg:w-auto">
          <Skeleton className="h-7 w-48 bg-slate-700/50" />
          <div className="space-y-2 md:space-y-3">
            <Skeleton className="h-10 w-64 bg-slate-700/50" />
            <Skeleton className="h-6 w-72 bg-slate-700/50" />
          </div>
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-11 w-40 bg-slate-700/50 rounded-full" />
            <Skeleton className="h-11 w-32 bg-slate-700/50 rounded-full" />
          </div>
        </div>
        <Skeleton className="w-48 h-48 rounded-full bg-slate-700/50 shrink-0" />
      </div>
    )
  }

  return (
    <div className="bg-[#1E293B] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row justify-between items-center lg:items-start text-white overflow-hidden relative mb-6 md:mb-8 gap-6 md:gap-8">
      <div className="space-y-4 sm:space-y-5 md:space-y-6 relative z-10 flex-1 w-full lg:w-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-brand-green text-xs md:text-sm font-medium">
          <Rocket className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Yearly Challenge 2026</span>
          <span className="sm:hidden">2026 Challenge</span>
        </div>

        <div className="space-y-2 md:space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight break-words">
            Save <span className="text-brand-green">{formatCurrency(remaining)}</span> More This Year
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base lg:text-lg break-words">Just ${dailyTarget} a day. Small steps, big results.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 pt-2 md:pt-4">
          <button
            onClick={() => setShowAutoSaveModal(true)}
            className="w-full sm:w-auto bg-brand-green hover:bg-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
          >
            <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </span>
            <span className="hidden sm:inline">Process Auto-Save</span>
            <span className="sm:hidden">Auto-Save</span>
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full sm:w-auto border border-slate-600 hover:bg-white/5 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold transition-colors text-sm md:text-base"
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex items-center justify-center shrink-0">
        {/* Simple SVG Circular Progress */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-700"
          />
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 80}
            strokeDashoffset={2 * Math.PI * 80 * (1 - progress / 100)}
            strokeLinecap="round"
            className="text-brand-green transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{progress.toFixed(1)}%</span>
          <span className="text-slate-400 text-xs sm:text-sm">Complete</span>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20" />

      {/* Auto-Save Confirmation Modal */}
      <Dialog open={showAutoSaveModal} onOpenChange={setShowAutoSaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-green" />
              Process Daily Auto-Save
            </DialogTitle>
            <DialogDescription>
              Save {formatCurrency(dailyAmount)} today to maintain your savings streak
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Daily Savings Amount</span>
                <span className="text-2xl font-bold text-brand-green">{formatCurrency(dailyAmount)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                This will be deducted from your wallet balance and added to your savings goal.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAutoSaveModal(false)}
                className="flex-1"
                disabled={processingAutoSave}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAutoSave}
                disabled={processingAutoSave}
                className="flex-1 bg-brand-green hover:bg-emerald-600"
              >
                {processingAutoSave ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Money Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Withdraw Money</DialogTitle>
            <DialogDescription className="text-gray-600">
              Transfer funds to your linked payment method
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <WithdrawMoney />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

