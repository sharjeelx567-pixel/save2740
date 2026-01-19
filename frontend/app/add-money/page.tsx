"use client"

import { ProtectedPage } from "@/components/protected-page"

import { useState } from "react"
import { ArrowUp, Check, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type Step = "amount" | "method" | "confirm" | "success" | "error"

function AddMoneyPageContent() {
  const [currentStep, setCurrentStep] = useState<Step>("amount")
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [fee, setFee] = useState(0)
  const [error, setError] = useState("")

  const calculateFee = (val: string, method: string) => {
    const num = parseFloat(val) || 0
    if (method === "card") {
      return Math.round((num * 0.029 + 30) * 100) / 100 // 2.9% + $0.30
    } else if (method === "bank") {
      return Math.round((num * 0.001) * 100) / 100 // 0.1% for ACH
    }
    return 0
  }

  const handleAmountChange = (val: string) => {
    setAmount(val)
    if (selectedMethod) {
      setFee(calculateFee(val, selectedMethod))
    }
  }

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method)
    setFee(calculateFee(amount, method))
  }

  const handleNext = () => {
    if (currentStep === "amount") {
      const num = parseFloat(amount)
      if (!num || num < 10) {
        setError("Minimum amount is $10")
        return
      }
      setCurrentStep("method")
    } else if (currentStep === "method") {
      if (!selectedMethod) {
        setError("Please select a payment method")
        return
      }
      setCurrentStep("confirm")
    } else if (currentStep === "confirm") {
      // Simulate payment processing
      setTimeout(() => {
        setCurrentStep("success")
      }, 1500)
    }
    setError("")
  }

  const handleReset = () => {
    setCurrentStep("amount")
    setAmount("")
    setSelectedMethod(null)
    setFee(0)
    setError("")
  }

  // Step 1: Amount
  if (currentStep === "amount") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Top Up Wallet</h1>
            <p className="text-slate-600 mb-8">How much would you like to add?</p>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Amount (USD)
                </label>
                <div className="relative">
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
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              {/* Suggested Amounts */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-3">
                  Or choose an amount
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setAmount(val.toString())
                        handleAmountChange(val.toString())
                      }}
                      className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                        amount === val.toString()
                          ? "bg-brand-green text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Select Payment Method
  if (currentStep === "method") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Select Payment Method</h1>
            <p className="text-slate-600 mb-8">How would you like to pay?</p>

            <div className="space-y-4 mb-8">
              {/* Card Option */}
              <button
                onClick={() => handleMethodSelect("card")}
                className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
                  selectedMethod === "card"
                    ? "border-brand-green bg-emerald-50"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">Debit Card</span>
                  {selectedMethod === "card" && (
                    <Check className="w-5 h-5 text-brand-green" />
                  )}
                </div>
                <p className="text-sm text-slate-600">•••• 4242 • 12/25</p>
                <p className="text-xs text-slate-500 mt-2">Fee: ${calculateFee(amount, "card").toFixed(2)} (2.9% + $0.30)</p>
              </button>

              {/* Bank Account Option */}
              <button
                onClick={() => handleMethodSelect("bank")}
                className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
                  selectedMethod === "bank"
                    ? "border-brand-green bg-green-50"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">Bank Account (ACH)</span>
                  {selectedMethod === "bank" && (
                    <Check className="w-5 h-5 text-brand-green" />
                  )}
                </div>
                <p className="text-sm text-slate-600">Chase •••• 6789</p>
                <p className="text-xs text-slate-500 mt-2">Fee: ${calculateFee(amount, "bank").toFixed(2)} (0.1%) • 1-3 days</p>
              </button>
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
    const total = (parseFloat(amount) || 0) + fee
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Confirm Payment</h1>
            <p className="text-slate-600 mb-8">Review your payment details</p>

            <div className="bg-slate-50 rounded-lg p-6 mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Amount</span>
                <span className="font-semibold text-slate-900">${parseFloat(amount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Fee</span>
                <span className="font-semibold text-slate-900">${fee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-300 pt-4 flex justify-between items-center">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-xl font-bold text-brand-green">${total.toFixed(2)}</span>
              </div>

              <div className="pt-2 text-xs text-slate-600">
                <p>From: {selectedMethod === "card" ? "Debit Card •••• 4242" : "Chase Bank •••• 6789"}</p>
                <p>To: Your Save2740 Wallet</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("method")}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
              >
                Confirm & Pay
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 4: Success
  if (currentStep === "success") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-brand-green" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-600 mb-8">Your wallet has been topped up</p>

            <div className="bg-slate-50 rounded-lg p-6 mb-8 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Amount Added</span>
                <span className="font-semibold text-slate-900">${parseFloat(amount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">New Wallet Balance</span>
                <span className="font-bold text-brand-green text-lg">$1,500.99</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Transaction ID</span>
                <span className="text-sm font-mono text-slate-600">TXN-2024-7821</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Add More
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
              >
                Done
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default function AddMoneyPage() {
  return (
    <ProtectedPage>
      <AddMoneyPageContent />
    </ProtectedPage>
  )
}
