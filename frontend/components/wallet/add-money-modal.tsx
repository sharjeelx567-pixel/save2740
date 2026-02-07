"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import { Loader2, DollarSign, AlertCircle, Check, CreditCard, Building2 } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"
import { useQuery } from "@tanstack/react-query"

interface AddMoneyModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialAmount?: number
}

interface PaymentMethod {
    _id: string
    type: 'card' | 'bank'
    name: string
    last4?: string
}



export function AddMoneyModal({ isOpen, onClose, onSuccess, initialAmount }: AddMoneyModalProps) {
    const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : "")
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Use cached wallet data
    const { balance: walletBalance } = useWallet()

    // Fetch payment methods when modal is open
    const { data: paymentMethods = [], isLoading: loadingMethods } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: async () => {
            const res = await apiClient.get<any>('/api/payment-methods')
            console.log('[AddMoneyModal] API response:', res)
            if (res.success) {
                // Handle double-wrapped response: { success, data: { success, data: [...] } }
                const methods = res.data?.data || res.data || []
                console.log('[AddMoneyModal] Extracted methods:', methods)
                if (!Array.isArray(methods)) return []
                
                // Transform to expected format
                const transformed = methods.map((m: any) => ({
                    _id: m._id || m.id,
                    type: (m.type === 'card' || m.type === 'debit' || m.type === 'credit') ? 'card' : 'bank',
                    name: m.name || (m.brand ? `${m.brand.toUpperCase()} Card` : 'Payment Method'),
                    last4: m.last4
                }))
                console.log('[AddMoneyModal] Transformed methods:', transformed)
                return transformed
            }
            return []
        },
        enabled: isOpen,
        staleTime: 60000
    })

    useEffect(() => {
        if (!isOpen) {
            setAmount(initialAmount ? initialAmount.toString() : "")
            setSelectedMethod(null)
            setError("")
        } else if (paymentMethods.length === 1 && !selectedMethod) {
            setSelectedMethod(paymentMethods[0]._id)
        }
    }, [isOpen, initialAmount, paymentMethods])

    // Removed fetchData function

    const calculateFee = (val: string, methodType: string) => {
        const num = parseFloat(val) || 0
        if (methodType === "card") {
            return Math.round((num * 0.029 + 0.30) * 100) / 100
        }
        return Math.min(Math.round((num * 0.008) * 100) / 100, 5)
    }

    const handleDeposit = async () => {
        const numAmount = parseFloat(amount)

        if (!numAmount || numAmount < 1) {
            setError("Minimum amount is $1")
            return
        }
        if (numAmount > 10000) {
            setError("Maximum amount is $10,000")
            return
        }
        if (!selectedMethod) {
            setError("Please select a payment method")
            return
        }

        setLoading(true)
        setError("")

        try {
            const response = await apiClient.post<{
                wallet: { balance: number }
                transaction: { transactionId: string }
                clientSecret?: string
                requiresAction: boolean
            }>('/api/wallet/deposit', {
                amount: numAmount,
                paymentMethodId: selectedMethod,
                currency: 'usd'
            })

            if (response.success && response.data) {
                // Handle both response structures: { data: {...} } or direct {...}
                const responseData = response.data.data || response.data

                // Handle 3D Secure if needed
                if (responseData.requiresAction && responseData.clientSecret) {
                    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
                    if (stripe) {
                        const { error: stripeError } = await stripe.confirmCardPayment(responseData.clientSecret)
                        if (stripeError) throw new Error(stripeError.message)
                    }
                }

                // Wallet balance will be refreshed when onSuccess() triggers a refetch
                toast.success(`Successfully added $${numAmount.toFixed(2)}!`)
                onSuccess()
                onClose()
            } else {
                throw new Error(response.error?.error || 'Payment failed')
            }
        } catch (err: any) {
            setError(err.message || "Payment failed. Please try again.")
            toast.error(err.message || "Payment failed")
        } finally {
            setLoading(false)
        }
    }

    const fee = selectedMethod && amount ? calculateFee(amount, paymentMethods.find(m => m._id === selectedMethod)?.type || 'card') : 0
    const total = (parseFloat(amount) || 0) + fee

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[400px] max-h-[90vh] overflow-y-auto p-4 sm:p-5 gap-3 sm:gap-4">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-base sm:text-lg">Add Money to Wallet</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Enter the amount you want to deposit into your Save2740 wallet.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
                    {/* Current Balance */}
                    {walletBalance !== undefined && (
                        <div className="p-2.5 sm:p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600 mb-0.5">Current Balance</p>
                            <p className="text-base sm:text-lg font-bold text-brand-green">${(walletBalance || 0).toFixed(2)}</p>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="amount" className="text-sm">Amount (USD)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                id="amount"
                                type="number"
                                placeholder="27.40"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value)
                                    setError("")
                                }}
                                className="pl-8 h-9 sm:h-10"
                                min="1"
                                max="10000"
                                step="0.01"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {[50, 100, 250, 500].map((val) => (
                                <Button
                                    key={val}
                                    type="button"
                                    variant={amount === val.toString() ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAmount(val.toString())}
                                    className={amount === val.toString() ? "bg-brand-green" : ""}
                                >
                                    ${val}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    {paymentMethods.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <Label>Payment Method</Label>
                            <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method._id}
                                        onClick={() => {
                                            setSelectedMethod(method._id)
                                            setError("")
                                        }}
                                        className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${selectedMethod === method._id
                                            ? "border-brand-green bg-emerald-50"
                                            : "border-slate-300 hover:border-slate-400"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {method.type === 'card' ? (
                                                    <CreditCard className="h-4 w-4 text-slate-600" />
                                                ) : (
                                                    <Building2 className="h-4 w-4 text-slate-600" />
                                                )}
                                                <span className="text-sm font-medium">{method.name}</span>
                                                {method.last4 && <span className="text-xs text-slate-500">•••• {method.last4}</span>}
                                            </div>
                                            {selectedMethod === method._id && (
                                                <Check className="h-4 w-4 text-brand-green" />
                                            )}
                                        </div>
                                        {selectedMethod === method._id && amount && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Fee: ${fee.toFixed(2)}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {selectedMethod && amount && parseFloat(amount) > 0 && (
                        <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Amount</span>
                                <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Fee</span>
                                <span className="font-medium">${fee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-300">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold text-brand-green">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* No Payment Methods */}
                    {loadingMethods ? (
                        <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-green" />
                            <p className="text-sm text-slate-500 mt-2">Loading payment methods...</p>
                        </div>
                    ) : paymentMethods.length === 0 && (
                        <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                            <p className="text-sm text-slate-500 mb-2">No payment methods found</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onClose()
                                    window.location.href = '/payment-methods'
                                }}
                            >
                                Add Payment Method
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeposit}
                        disabled={loading || !amount || parseFloat(amount) < 1 || !selectedMethod || paymentMethods.length === 0}
                        className="bg-brand-green hover:bg-emerald-600 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Confirm Deposit"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

