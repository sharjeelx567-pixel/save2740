"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText, Phone, Mail } from "lucide-react"

interface ChargebackNoticeProps {
    transactionId: string
    amount: number
    reason?: string
}

export function ChargebackNotice({ transactionId, amount, reason }: ChargebackNoticeProps) {
    return (
        <Card className="border-red-200 bg-red-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Chargeback Notice
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Transaction ID</span>
                        <span className="font-mono text-sm">{transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-bold text-red-600">${amount.toFixed(2)}</span>
                    </div>
                    {reason && (
                        <div>
                            <span className="text-slate-600">Reason: </span>
                            <span className="font-medium">{reason}</span>
                        </div>
                    )}
                </div>

                <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <p className="text-sm text-red-900 font-semibold mb-2">What is a Chargeback?</p>
                    <p className="text-sm text-red-800">
                        A chargeback occurs when a customer disputes a transaction with their bank. 
                        The funds have been reversed from your account pending investigation.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Next Steps:</p>
                    <ol className="text-sm text-slate-700 space-y-1 ml-4 list-decimal">
                        <li>Review the transaction details above</li>
                        <li>Gather any supporting documentation</li>
                        <li>Contact our support team immediately</li>
                        <li>Submit evidence to dispute the chargeback</li>
                    </ol>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.location.href = '/support'}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        File Dispute
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.location.href = 'mailto:support@save2740.com'}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Support
                    </Button>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                    <p className="font-semibold mb-1">Need Immediate Help?</p>
                    <p>Call us at 1-800-XXX-XXXX or email support@save2740.com</p>
                </div>
            </CardContent>
        </Card>
    )
}

