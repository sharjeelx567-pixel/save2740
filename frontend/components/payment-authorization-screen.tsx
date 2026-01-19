"use client"

import { useState } from "react"
import { CheckCircle2, Lock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PaymentAuthDetails {
  id: string
  amount: number
  merchant: string
  description: string
  paymentMethod: string
  timestamp: Date
  category: string
}

/**
 * PaymentAuthorizationScreen Component
 * Screen to confirm and authorize payments
 */
export function PaymentAuthorizationScreen({
  payment,
  onAuthorize,
  onDeny,
}: {
  payment?: PaymentAuthDetails
  onAuthorize?: () => void
  onDeny?: () => void
}) {
  const [step, setStep] = useState<"review" | "confirm" | "success">("review")
  const [showDetails, setShowDetails] = useState(false)

  const mockPayment: PaymentAuthDetails = payment || {
    id: "AUTH123",
    amount: 299.99,
    merchant: "Apple Inc.",
    description: "Apple One Membership - Annual",
    paymentMethod: "Visa •••• 4242",
    timestamp: new Date(),
    category: "Subscriptions",
  }

  const handleAuthorize = () => {
    setStep("confirm")
    setTimeout(() => {
      setStep("success")
      onAuthorize?.()
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-4">
        {step === "review" && (
          <>
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <Lock className="w-8 h-8 text-brand-green" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Authorize Payment</h1>
              <p className="text-slate-600">
                Please verify this transaction before proceeding
              </p>
            </div>

            {/* Payment Amount - Prominent */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-sm text-slate-600 font-semibold">Payment Amount</p>
                <p className="text-5xl font-bold text-slate-900">
                  ${mockPayment.amount.toFixed(2)}
                </p>
                <p className="text-sm text-slate-600">{mockPayment.merchant}</p>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="border-2 border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Merchant</span>
                  <span className="font-semibold text-slate-900">{mockPayment.merchant}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between">
                  <span className="text-slate-600">Description</span>
                  <span className="font-semibold text-slate-900 text-right text-sm">
                    {mockPayment.description}
                  </span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method</span>
                  <span className="font-semibold text-slate-900">
                    {mockPayment.paymentMethod}
                  </span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between">
                  <span className="text-slate-600">Category</span>
                  <span className="px-3 py-1 bg-green-100 text-brand-green rounded-full text-xs font-bold">
                    {mockPayment.category}
                  </span>
                </div>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-brand-green hover:text-brand-green/80 text-sm font-semibold mt-3"
                >
                  {showDetails ? "Hide" : "Show"} More Details
                </button>

                {showDetails && (
                  <>
                    <div className="h-px bg-slate-200" />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="text-slate-700 font-mono">{mockPayment.id}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Time</span>
                      <span className="text-slate-700">
                        {mockPayment.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900">
                This transaction is encrypted and secure. Your payment information is protected.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleAuthorize}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-brand-green text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-600 transition-all shadow-lg"
              >
                Authorize Payment
              </button>
              <button
                onClick={onDeny}
                className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <div className="text-center py-12 space-y-6">
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <p className="text-slate-600 font-semibold">Processing your payment...</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-12 space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Payment Authorized</h2>
              <p className="text-slate-600">
                Your payment of ${mockPayment.amount.toFixed(2)} has been successfully
                authorized.
              </p>
            </div>

            <Card className="border-2 border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Reference</span>
                  <span className="font-mono text-slate-900">{mockPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <span className="px-2 py-1 bg-emerald-200 text-emerald-800 rounded text-xs font-bold">
                    Authorized
                  </span>
                </div>
              </CardContent>
            </Card>

            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            >
              Back to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
