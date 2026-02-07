"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Download } from "lucide-react"

interface PaymentReceiptProps {
    transaction: {
        transactionId: string
        amount: number
        type: 'deposit' | 'withdrawal'
        status: 'completed' | 'pending' | 'failed'
        description: string
        createdAt: string
        paymentMethod?: string
    }
    onClose?: () => void
}

export function PaymentReceipt({ transaction, onClose }: PaymentReceiptProps) {
    const handleDownload = () => {
        const receipt = `
PAYMENT RECEIPT
================

Transaction ID: ${transaction.transactionId}
Date: ${new Date(transaction.createdAt).toLocaleString()}
Type: ${transaction.type.toUpperCase()}
Amount: $${transaction.amount.toFixed(2)}
Status: ${transaction.status.toUpperCase()}
Description: ${transaction.description}
${transaction.paymentMethod ? `Payment Method: ${transaction.paymentMethod}` : ''}

Thank you for your transaction!
        `.trim()

        const blob = new Blob([receipt], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${transaction.transactionId}.txt`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    return (
        <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
                <div className="text-center mb-6">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8 text-brand-green" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Receipt</h2>
                    <p className="text-sm text-slate-600">Transaction completed successfully</p>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-600">Transaction ID</span>
                        <span className="font-mono text-sm">{transaction.transactionId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-600">Date</span>
                        <span className="font-medium">{new Date(transaction.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-600">Type</span>
                        <span className="font-medium capitalize">{transaction.type}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-600">Amount</span>
                        <span className={`font-bold text-lg ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-600">Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {transaction.status.toUpperCase()}
                        </span>
                    </div>
                    {transaction.description && (
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Description</span>
                            <span className="font-medium text-right">{transaction.description}</span>
                        </div>
                    )}
                    {transaction.paymentMethod && (
                        <div className="flex justify-between py-2">
                            <span className="text-slate-600">Payment Method</span>
                            <span className="font-medium">{transaction.paymentMethod}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        className="flex-1"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                    {onClose && (
                        <Button
                            onClick={onClose}
                            className="flex-1 bg-brand-green hover:bg-emerald-600 text-white"
                        >
                            Close
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

