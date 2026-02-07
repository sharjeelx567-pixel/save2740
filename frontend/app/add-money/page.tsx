"use client"

import { ProtectedPage } from "@/components/protected-page"
import { useState, useEffect } from "react"
import { ArrowUp, Check, AlertCircle, Loader2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"

type Step = "amount" | "method" | "confirm" | "processing" | "success" | "error"

interface PaymentMethod {
  _id: string
  type: 'card' | 'bank'
  name: string
  last4?: string
  brand?: string
}

interface WalletData {
  balance: number
  availableBalance: number
  status: 'active' | 'frozen' | 'suspended'
}

function AddMoneyPageContent() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>("amount")
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [fee, setFee] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch wallet
      const walletRes = await apiClient.get<any>('/api/wallet')
      if (walletRes.success && walletRes.data) {
        // Handle double-wrapped response
        const walletData = walletRes.data?.data || walletRes.data
        setWallet(walletData)
        
        // Check if wallet is frozen
        if (walletData.status === 'frozen' || walletData.status === 'suspended') {
          toast.error(`Wallet is ${walletData.status}. Cannot add money.`)
          router.push('/wallet')
          return
        }
      }

      // Fetch payment methods
      const methodsRes = await apiClient.get<any>('/api/payment-methods')
      if (methodsRes.success) {
        // Handle double-wrapped response: { success, data: { success, data: [...] } }
        const methods = methodsRes.data?.data || methodsRes.data || []
        setPaymentMethods(Array.isArray(methods) ? methods : [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
      toast.error("Failed to load payment methods")
    }
  }

  const calculateFee = (val: string, methodType: string) => {
    const num = parseFloat(val) || 0
    if (methodType === "card") {
      return Math.round((num * 0.029 + 0.30) * 100) / 100 // 2.9% + $0.30
    } else if (methodType === "bank") {
      return Math.round((num * 0.008) * 100) / 100 // 0.8% for ACH (capped at $5)
    }
    return 0
  }

  const handleAmountChange = (val: string) => {
    setAmount(val)
    if (selectedMethod) {
      const method = paymentMethods.find(m => m._id === selectedMethod)
      if (method) {
        setFee(calculateFee(val, method.type))
      }
    }
    setError("")
  }

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    const method = paymentMethods.find(m => m._id === methodId)
    if (method) {
      setFee(calculateFee(amount, method.type))
    }
    setError("")
  }

  const handleNext = async () => {
    if (currentStep === "amount") {
      const num = parseFloat(amount)
      if (!num || num < 1) {
        setError("Minimum amount is $1")
        return
      }
      if (num > 10000) {
        setError("Maximum amount is $10,000")
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
      await processPayment()
    }
    setError("")
  }

  const processPayment = async () => {
    setLoading(true)
    setCurrentStep("processing")
    setError("")

    try {
      const numAmount = parseFloat(amount)
      const selectedPaymentMethod = paymentMethods.find(m => m._id === selectedMethod)

      const response = await apiClient.post<{
        wallet: WalletData
        transaction: { _id: string; transactionId: string }
        clientSecret?: string
        requiresAction: boolean
      }>('/api/wallet/deposit', {
        amount: numAmount,
        paymentMethodId: selectedMethod,
        currency: 'usd'
      })

      if (response.success && response.data) {
        setTransactionId(response.data.transaction.transactionId || response.data.transaction._id)

        // If Stripe requires action (3D Secure), handle it
        if (response.data.requiresAction && response.data.clientSecret) {
          try {
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
            if (stripe) {
              const { error: stripeError } = await stripe.confirmCardPayment(response.data.clientSecret)
              if (stripeError) {
                throw new Error(stripeError.message)
              }
            }
          } catch (stripeErr: any) {
            throw new Error(stripeErr.message || 'Payment confirmation failed')
          }
        }

        // Update wallet balance
        if (response.data.wallet) {
          setWallet(response.data.wallet)
        }

        // Check transaction status - if pending, wait a bit
        if (response.data.transaction) {
          // Poll for completion (in production, use webhooks)
          setTimeout(() => {
            setCurrentStep("success")
            setLoading(false)
            toast.success(`Successfully added $${numAmount.toFixed(2)} to your wallet!`)
          }, 2000)
        } else {
          setCurrentStep("success")
          setLoading(false)
        }
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Payment failed')
      }
    } catch (err: any) {
      console.error("Payment error:", err)
      setError(err.message || "Payment failed. Please try again.")
      setCurrentStep("error")
      setLoading(false)
      toast.error(err.message || "Payment failed")
    }
  }

  const handleReset = () => {
    setCurrentStep("amount")
    setAmount("")
    setSelectedMethod(null)
    setFee(0)
    setError("")
    setTransactionId(null)
    fetchData() // Refresh wallet balance
  }

  // Step 1: Amount
  if (currentStep === "amount") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Top Up Wallet</h1>
            <p className="text-slate-600 mb-8">How much would you like to add?</p>

            {wallet && (
              <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Current Balance</p>
                <p className="text-lg font-bold text-brand-green">${wallet.balance.toFixed(2)}</p>
              </div>
            )}

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
                    min="1"
                    max="10000"
                    step="0.01"
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
                      onClick={() => handleAmountChange(val.toString())}
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
                disabled={!amount || parseFloat(amount) < 1}
                className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <button
                    key={method._id}
                    onClick={() => handleMethodSelect(method._id)}
                    className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
                      selectedMethod === method._id
                        ? "border-brand-green bg-emerald-50"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">
                        {method.type === 'card' ? 'Debit Card' : 'Bank Account'}
                      </span>
                      {selectedMethod === method._id && (
                        <Check className="w-5 h-5 text-brand-green" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {method.name} {method.last4 ? `•••• ${method.last4}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Fee: ${calculateFee(amount, method.type).toFixed(2)} 
                      {method.type === 'card' ? ' (2.9% + $0.30)' : ' (0.8%, max $5)'}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-slate-500 mb-2">No payment methods found</p>
                  <button
                    onClick={() => router.push('/payment-methods')}
                    className="text-sm text-brand-green hover:underline"
                  >
                    Add Payment Method
                  </button>
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
                disabled={!selectedMethod || paymentMethods.length === 0}
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
    const total = (parseFloat(amount) || 0) + fee
    const selectedPaymentMethod = paymentMethods.find(m => m._id === selectedMethod)
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
                <p>From: {selectedPaymentMethod?.name} {selectedPaymentMethod?.last4 ? `•••• ${selectedPaymentMethod.last4}` : ''}</p>
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
                disabled={loading}
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Pay
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
              <Loader2 className="w-8 h-8 text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Processing Payment...</h1>
            <p className="text-slate-600">Please wait while we process your payment</p>
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

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-600 mb-8">Your wallet has been topped up</p>

            <div className="bg-slate-50 rounded-lg p-6 mb-8 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Amount Added</span>
                <span className="font-semibold text-slate-900">${parseFloat(amount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">New Wallet Balance</span>
                <span className="font-bold text-brand-green text-lg">
                  ${wallet ? wallet.balance.toFixed(2) : '0.00'}
                </span>
              </div>
              {transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Transaction ID</span>
                  <span className="text-sm font-mono text-slate-600">{transactionId}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Add More
              </button>
              <button
                onClick={() => router.push('/wallet')}
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

  // Step 6: Error
  if (currentStep === "error") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-600 mb-4">{error || "An error occurred while processing your payment"}</p>

            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-slate-600">
                Please check your payment method and try again. If the problem persists, contact support.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("confirm")}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
              >
                Start Over
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

