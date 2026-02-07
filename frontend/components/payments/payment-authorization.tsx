"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Shield, AlertTriangle, CheckCircle2 } from "lucide-react"

interface PaymentAuthorizationProps {
    isOpen: boolean
    amount: number
    description: string
    paymentMethod: string
    onAuthorize: () => Promise<void>
    onCancel: () => void
}

export function PaymentAuthorization({
    isOpen,
    amount,
    description,
    paymentMethod,
    onAuthorize,
    onCancel
}: PaymentAuthorizationProps) {
    const [authorizing, setAuthorizing] = useState(false)
    const [authorized, setAuthorized] = useState(false)

    const handleAuthorize = async () => {
        setAuthorizing(true)
        try {
            await onAuthorize()
            setAuthorized(true)
            setTimeout(() => {
                setAuthorized(false)
            }, 2000)
        } catch (error) {
            console.error("Authorization failed:", error)
        } finally {
            setAuthorizing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-brand-green" />
                        Payment Authorization
                    </DialogTitle>
                    <DialogDescription>
                        Please review and authorize this payment
                    </DialogDescription>
                </DialogHeader>

                {authorized ? (
                    <div className="text-center py-8">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-brand-green" />
                        </div>
                        <p className="text-lg font-semibold text-green-900">Payment Authorized</p>
                        <p className="text-sm text-green-700 mt-2">Processing your payment...</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Amount</span>
                                    <span className="font-bold text-lg text-brand-green">${amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Description</span>
                                    <span className="font-medium">{description}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Payment Method</span>
                                    <span className="font-medium">{paymentMethod}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold mb-1">Security Notice</p>
                                    <p>By authorizing this payment, you agree to the transaction. This action cannot be undone.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={authorizing}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAuthorize}
                                disabled={authorizing}
                                className="flex-1 bg-brand-green hover:bg-emerald-600 text-white"
                            >
                                {authorizing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authorizing...
                                    </>
                                ) : (
                                    "Authorize Payment"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

