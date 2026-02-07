"use client"

import { useState, useEffect } from "react"
import { ArrowDown, AlertCircle, Check, Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { ProtectedPage } from "@/components/protected-page"
import { toast } from "sonner"

type WithdrawalStep = "amount" | "account" | "confirm" | "processing" | "success"

interface WithdrawalRecord {
  id: string
  amount: number
  date: string
  status: "completed" | "pending" | "failed"
  bankAccount: string
  transactionId: string
}

interface BankAccount {
  id: string
  name: string
  last4: string
  type: string
}

export default function WithdrawalPage() {
  return (
    <ProtectedPage>
      <WithdrawalPageContent />
    </ProtectedPage>
  )
}

function WithdrawalPageContent() {
  const [currentStep, setCurrentStep] = useState<WithdrawalStep>("amount")
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRecord[]>([])
  const [error, setError] = useState("")

  // Data State
  const [availableBalance, setAvailableBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const minWithdrawal = 10
  const maxWithdrawal = availableBalance

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true)
      try {
        // Fetch Wallet Data
        const walletRes = await apiClient.get<any>('/api/wallet')
        if (walletRes.success && walletRes.data) {
          setAvailableBalance(walletRes.data.availableBalance || 0)
          setLockedBalance(walletRes.data.lockedInPockets || 0)
        }

        // Fetch Payment Methods (Banks only)
        const methodsRes = await apiClient.get<any[]>('/api/payment-methods')
        if (methodsRes.success && methodsRes.data) {
          const banks = methodsRes.data
            .filter((m: any) => m.type === 'bank')
            .map((m: any) => ({
              id: m._id || m.id,
              name: m.name || m.bankName || 'Bank Account',
              last4: m.last4 || '****',
              type: m.accountType || 'Checking'
            }))
          setBankAccounts(banks)
        }

        // Fetch Transaction History (Withdrawals)
        const txRes = await apiClient.get<any>('/api/wallet/transactions')
        if (txRes.success && txRes.data?.transactions) {
          const withdrawals = txRes.data.transactions
            .filter((tx: any) => tx.type === 'withdrawal' || tx.type === 'withdraw')
            .map((tx: any) => ({
              id: tx._id || tx.id,
              amount: tx.amount,
              date: new Date(tx.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              status: tx.status,
              bankAccount: tx.paymentMethodLast4 ? `Account •••• ${tx.paymentMethodLast4}` : 'Bank Account',
              transactionId: tx.transactionId || `WTD-${tx._id.substring(0, 6)}`
            }))
          setWithdrawalHistory(withdrawals)
        }

      } catch (err) {
        console.error("Failed to fetch withdrawal data", err)
        toast.error("Failed to load wallet data")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const handleAmountChange = (val: string) => {
    setAmount(val)
    setError("")
  }

  const handleNext = async () => {
    if (currentStep === "amount") {
      const num = parseFloat(amount)
      if (!num || num < minWithdrawal) {
        setError(`Minimum withdrawal is $${minWithdrawal}`)
        return
      }
      if (num > maxWithdrawal) {
        setError(`Maximum withdrawal is $${maxWithdrawal.toFixed(2)}`)
        return
      }
      setCurrentStep("account")
    } else if (currentStep === "account") {
      if (!selectedAccount) {
        setError("Please select a bank account")
        return
      }
      setCurrentStep("confirm")
    } else if (currentStep === "confirm") {
      setIsProcessing(true)
      setCurrentStep("processing")

      try {
        const response = await apiClient.post('/api/wallet/withdraw', {
          amount: parseFloat(amount),
          bankAccountId: selectedAccount,
          reason: "User requested withdrawal"
        })

        if (response.success) {
          // Wait a brief moment to show processing state
          setTimeout(() => {
            setCurrentStep("success")
            setIsProcessing(false)
            // Update history locally or refetch
            const newRecord: WithdrawalRecord = {
              id: "temp-new",
              amount: parseFloat(amount),
              date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
              status: "processing" as any, // Type hack if needed, or update interface
              bankAccount: bankAccounts.find(b => b.id === selectedAccount)?.last4 ? `•••• ${bankAccounts.find(b => b.id === selectedAccount)?.last4}` : 'Bank Account',
              transactionId: `WTD-NEW`
            }
            setWithdrawalHistory([newRecord, ...withdrawalHistory])
            // Re-fetch balance
            apiClient.get<any>('/api/wallet').then(res => {
              if (res.success && res.data) setAvailableBalance(res.data.availableBalance)
            })
          }, 1500)
        } else {
          setError(response.error?.error || "Withdrawal failed")
          setCurrentStep("confirm") // Go back
          setIsProcessing(false)
        }
      } catch (err) {
        console.error("Withdrawal error", err)
        setError("An unexpected error occurred")
        setCurrentStep("confirm")
        setIsProcessing(false)
      }
    }
  }

  const handleReset = () => {
    setCurrentStep("amount")
    setAmount("")
    setSelectedAccount(null)
    setError("")
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    )
  }

  // Step 1: Amount
  if (currentStep === "amount") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Request Withdrawal</h1>
            <p className="text-slate-600">Transfer funds from your wallet to your bank account</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Withdrawal Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <label className="text-lg font-semibold text-slate-900">Withdrawal Amount</label>
                      <span className="text-sm text-slate-600">
                        Available: ${availableBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-600">
                        $
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 text-2xl font-bold border-2 border-slate-300 rounded-lg focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Suggested Amounts */}
                  <div className="mb-8">
                    <label className="text-sm font-medium text-slate-700 block mb-3">
                      Quick select
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[100, 250, 500, availableBalance].filter(val => val <= availableBalance && val > 0).slice(0, 4).map((val) => (
                        <button
                          key={val}
                          onClick={() => handleAmountChange(val.toString())}
                          className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${amount === val.toString()
                            ? "bg-brand-green text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                        >
                          ${val.toFixed(0)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-brand-green">
                      <strong>⏱️ Processing time:</strong> ACH transfers typically take 1-3 business days
                    </p>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={availableBalance < minWithdrawal}
                    className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Balance Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Wallet Status</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Available</p>
                      <p className="text-2xl font-bold text-brand-green">${availableBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Locked in Pockets</p>
                      <p className="text-2xl font-bold text-brand-green">${lockedBalance.toFixed(2)}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">Total Balance</p>
                      <p className="text-2xl font-bold text-slate-900">${(availableBalance + lockedBalance).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Select Account
  if (currentStep === "account") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Select Bank Account</h1>
            <p className="text-slate-600 mb-8">Where should we send your withdrawal?</p>

            <div className="space-y-4 mb-8">
              {bankAccounts.length > 0 ? (
                bankAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account.id)
                      setError("")
                    }}
                    className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${selectedAccount === account.id
                      ? "border-brand-green bg-emerald-50"
                      : "border-slate-300 hover:border-slate-400"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{account.name}</p>
                        <p className="text-sm text-slate-600">•••• {account.last4} • {account.type}</p>
                      </div>
                      {selectedAccount === account.id && (
                        <Check className="w-5 h-5 text-brand-green" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-slate-500 mb-2">No bank accounts linked</p>
                  <p className="text-xs text-slate-400">Please add payment method first</p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("amount")}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={bankAccounts.length === 0}
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 3: Confirm
  if (currentStep === "confirm") {
    const selectedBank = bankAccounts.find(b => b.id === selectedAccount);
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Confirm Withdrawal</h1>
            <p className="text-slate-600 mb-8">Review your withdrawal details</p>

            <div className="bg-slate-50 rounded-lg p-6 mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Amount</span>
                <span className="font-bold text-slate-900 text-lg">${parseFloat(amount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Bank Account</span>
                <span className="font-semibold text-slate-900">{selectedBank?.name} •••• {selectedBank?.last4}</span>
              </div>
              <div className="border-t border-slate-300 pt-4 flex justify-between items-center">
                <span className="font-semibold text-slate-900">New Balance</span>
                <span className="text-xl font-bold text-brand-green">
                  ${(availableBalance - parseFloat(amount || "0")).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-600 pt-4">
                ⏱️ This withdrawal will arrive in 1-3 business days
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("account")}
                disabled={isProcessing}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={isProcessing}
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {isProcessing ? 'Processing' : 'Confirm'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 4: Processing 
  if (currentStep === "processing") {
    // This state might be transient now as we await the API call in confirm step
    // But we keep it if we want a dedicated view during longer waits
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-spin">
              <Clock className="w-8 h-8 text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Processing...</h1>
            <p className="text-slate-600">Please wait while we process your withdrawal</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 5: Success
  if (currentStep === "success") {
    const selectedBank = bankAccounts.find(b => b.id === selectedAccount);
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-brand-green" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Withdrawal Requested!</h1>
            <p className="text-slate-600 mb-8">Your withdrawal is being processed</p>

            <div className="bg-slate-50 rounded-lg p-6 mb-8 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Withdrawal Amount</span>
                <span className="font-bold text-slate-900">${parseFloat(amount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Bank Account</span>
                <span className="font-semibold text-slate-900">{selectedBank?.name} •••• {selectedBank?.last4}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Status</span>
                <span className="px-2 py-1 bg-amber-50 text-amber-900 rounded text-xs font-medium border border-amber-200">
                  Processing
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              ⏱️ Your withdrawal will arrive in your bank account within 1-3 business days
            </p>

            <button
              onClick={handleReset}
              className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
            >
              Done
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

