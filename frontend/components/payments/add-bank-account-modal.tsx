"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import { Loader2, Building2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface AddBankAccountModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddBankAccountModal({ isOpen, onClose, onSuccess }: AddBankAccountModalProps) {
    const [formData, setFormData] = useState({
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        accountType: 'checking' as 'checking' | 'savings',
        isDefault: false
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async () => {
        setError("")
        
        if (!formData.bankName || !formData.accountNumber || !formData.routingNumber) {
            setError("Please fill in all required fields")
            return
        }

        if (formData.routingNumber.length !== 9) {
            setError("Routing number must be 9 digits")
            return
        }

        setLoading(true)

        try {
            const response = await apiClient.post('/api/payment-methods', {
                type: 'bank_account',
                bankName: formData.bankName,
                accountNumber: formData.accountNumber,
                routingNumber: formData.routingNumber,
                accountType: formData.accountType,
                isDefault: formData.isDefault
            })

            if (response.success) {
                toast.success("Bank account added successfully")
                onSuccess()
                onClose()
                setFormData({
                    bankName: '',
                    accountNumber: '',
                    routingNumber: '',
                    accountType: 'checking',
                    isDefault: false
                })
            } else {
                throw new Error(typeof response.error === 'string' ? response.error : 'Failed to add bank account')
            }
        } catch (err: any) {
            setError(err.message || "Failed to add bank account")
            toast.error(err.message || "Failed to add bank account")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-brand-green" />
                        Add Bank Account
                    </DialogTitle>
                    <DialogDescription>
                        Connect your bank account for ACH transfers (lower fees)
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                            id="bankName"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            placeholder="e.g., Chase Bank"
                        />
                    </div>

                    <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                            id="accountNumber"
                            type="text"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                            placeholder="Enter account number"
                        />
                    </div>

                    <div>
                        <Label htmlFor="routingNumber">Routing Number</Label>
                        <Input
                            id="routingNumber"
                            type="text"
                            value={formData.routingNumber}
                            onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                            placeholder="9-digit routing number"
                            maxLength={9}
                        />
                    </div>

                    <div>
                        <Label htmlFor="accountType">Account Type</Label>
                        <select
                            id="accountType"
                            value={formData.accountType}
                            onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'checking' | 'savings' })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="rounded"
                        />
                        <Label htmlFor="isDefault" className="cursor-pointer">
                            Set as default payment method
                        </Label>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <p className="font-semibold mb-1">🔒 Secure & Encrypted</p>
                        <p>Your bank details are encrypted and stored securely. We use Stripe for payment processing.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-brand-green hover:bg-emerald-600 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            "Add Bank Account"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

