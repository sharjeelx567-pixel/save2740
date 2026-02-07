"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, DollarSign, CreditCard, Landmark, Check } from "lucide-react"

interface WithdrawModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    availableBalance: number
}

interface PaymentMethod {
    _id: string
    type: 'card' | 'bank_account'
    name: string
    last4: string
    brand?: string
    isDefault?: boolean
}

export function WithdrawModal({ isOpen, onClose, onSuccess, availableBalance }: WithdrawModalProps) {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [selectedMethodId, setSelectedMethodId] = useState<string>("")
    const [loadingMethods, setLoadingMethods] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchPaymentMethods()
            setAmount("")
            setError("")
        }
    }, [isOpen])

    const fetchPaymentMethods = async () => {
        setLoadingMethods(true)
        try {
            const response = await fetch('/api/payment-methods', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()
            if (data.success && Array.isArray(data.data)) {
                setPaymentMethods(data.data)
                // Auto-select default or first method
                const defaultMethod = data.data.find((m: PaymentMethod) => m.isDefault)
                if (defaultMethod) {
                    setSelectedMethodId(defaultMethod._id)
                } else if (data.data.length > 0) {
                    setSelectedMethodId(data.data[0]._id)
                }
            }
        } catch (err) {
            console.error("Failed to fetch payment methods", err)
        } finally {
            setLoadingMethods(false)
        }
    }

    const handleWithdraw = async () => {
        const val = parseFloat(amount)
        if (!amount || val <= 0) {
            setError("Please enter a valid amount")
            return
        }
        if (val > availableBalance) {
            setError(`Insufficient funds. Max: $${availableBalance.toFixed(2)}`)
            return
        }
        if (!selectedMethodId) {
            setError("Please select a payment method")
            return
        }

        setLoading(true)
        setError("")

        try {
            const response = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: val,
                    paymentMethodId: selectedMethodId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to withdraw")
            }

            setAmount("")
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Transfer available funds back to your card or bank account.
                        <br />
                        <span className="text-sm text-slate-500">Available to Withdraw: ${availableBalance.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Amount Input */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="amount" className="text-left">Amount (USD)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-left">Withdraw To</Label>
                        {loadingMethods ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading payment methods...
                            </div>
                        ) : paymentMethods.length === 0 ? (
                            <div className="text-sm text-red-500 border border-red-100 bg-red-50 p-3 rounded-md">
                                No payment methods found. Please add a card in Settings.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {paymentMethods.map((method) => (
                                    <div
                                        key={method._id}
                                        onClick={() => setSelectedMethodId(method._id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedMethodId === method._id
                                                ? "border-brand-green bg-emerald-50 ring-1 ring-brand-green"
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedMethodId === method._id ? "bg-brand-green text-white" : "bg-slate-100 text-slate-500"
                                            }`}>
                                            {method.type === 'card' ? <CreditCard className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {method.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {method.type === 'card' ? 'Card' : 'Bank'} ending in {method.last4}
                                            </p>
                                        </div>
                                        {selectedMethodId === method._id && (
                                            <Check className="w-4 h-4 text-brand-green shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleWithdraw} disabled={loading || !selectedMethodId} className="bg-slate-700 hover:bg-slate-600 text-white">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Confirm Withdrawal"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

