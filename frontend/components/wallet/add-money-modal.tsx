"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WalletService } from "@/lib/wallet-service"
import { Loader2, DollarSign } from "lucide-react"

interface AddMoneyModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddMoneyModal({ isOpen, onClose, onSuccess }: AddMoneyModalProps) {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid amount")
            return
        }

        setLoading(true)
        setError("")

        try {
            // Create a direct API call or use the service if updated
            const response = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: parseFloat(amount) })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to deposit")
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
                    <DialogTitle>Add Money to Wallet</DialogTitle>
                    <DialogDescription>
                        Enter the amount you want to deposit into your Save2740 wallet.
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
                                placeholder="27.40"
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
                    <Button onClick={handleDeposit} disabled={loading} className="bg-brand-green hover:bg-emerald-600 text-white">
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
