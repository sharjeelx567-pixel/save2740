"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, DollarSign } from "lucide-react"

interface WithdrawModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    availableBalance: number
}

export function WithdrawModal({ isOpen, onClose, onSuccess, availableBalance }: WithdrawModalProps) {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

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

        setLoading(true)
        setError("")

        try {
            const response = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: val })
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
                        Transfer available funds back to your bank account.
                        <br />
                        <span className="text-sm text-slate-500">Available to Withdraw: ${availableBalance.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
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

                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleWithdraw} disabled={loading} className="bg-slate-700 hover:bg-slate-600 text-white">
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

