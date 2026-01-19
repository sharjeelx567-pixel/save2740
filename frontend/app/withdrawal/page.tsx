"use client"

import { useState } from "react"
import { ArrowDown, AlertCircle, Check, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type WithdrawalStep = "amount" | "account" | "confirm" | "processing" | "success"

interface WithdrawalRecord {
  id: string
  amount: number
  date: string
  status: "completed" | "pending" | "failed"
  bankAccount: string
  transactionId: string
}

const MOCK_WITHDRAWAL_HISTORY: WithdrawalRecord[] = [
  {
    id: "1",
    amount: 274.0,
    date: "Dec 20, 2025",
    status: "completed",
    bankAccount: "Chase •••• 6789",
    transactionId: "WTD-2025-001",
  },
  {
    id: "2",
    amount: 500.0,
    date: "Dec 10, 2025",
    status: "completed",
    bankAccount: "Chase •••• 6789",
    transactionId: "WTD-2025-002",
  },
]

export default function WithdrawalPage() {
  const [currentStep, setCurrentStep] = useState<WithdrawalStep>("amount")
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [withdrawalHistory, setWithdrawalHistory] = useState(MOCK_WITHDRAWAL_HISTORY)
  const [error, setError] = useState("")

  const availableBalance = 1250.5
  const minWithdrawal = 10
  const maxWithdrawal = availableBalance

  const handleAmountChange = (val: string) => {
    setAmount(val)
    setError("")
  }

  const handleNext = () => {
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
      setCurrentStep("processing")
      // Simulate processing
      setTimeout(() => {
        const newRecord: WithdrawalRecord = {
          id: String(withdrawalHistory.length + 1),
          amount: parseFloat(amount),
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          status: "pending",
          bankAccount: "Chase •••• 6789",
          transactionId: `WTD-${Date.now()}`,
        }
        setWithdrawalHistory([newRecord, ...withdrawalHistory])
        setCurrentStep("success")
      }, 2000)
    }
  }

  const handleReset = () => {
    setCurrentStep("amount")
    setAmount("")
    setSelectedAccount(null)
    setError("")
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
                      {[100, 250, 500, availableBalance].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleAmountChange(val.toString())}
                          className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                            amount === val.toString()
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
                    className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
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
                      <p className="text-2xl font-bold text-brand-green">$500.00</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">Total Balance</p>
                      <p className="text-2xl font-bold text-slate-900">$1,750.50</p>
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
              {[
                { id: "1", name: "Chase Bank", last4: "6789", type: "Checking" },
                { id: "2", name: "Bank of America", last4: "4321", type: "Savings" },
              ].map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account.id)
                    setError("")
                  }}
                  className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
                    selectedAccount === account.id
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
              ))}
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
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
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
                <span className="font-semibold text-slate-900">Chase •••• 6789</span>
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

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("account")}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 4: Processing
  if (currentStep === "processing") {
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
                <span className="font-semibold text-slate-900">Chase •••• 6789</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Status</span>
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-200">
                  Pending
                </span>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                <span className="text-slate-600">Transaction ID</span>
                <span className="text-sm font-mono text-slate-600">WTD-{Date.now()}</span>
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
