"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, DollarSign, CreditCard } from "lucide-react"

interface AutoDebitConfirmationProps {
    config: {
        amount: number
        frequency: 'daily' | 'weekly' | 'monthly'
        paymentMethod: string
        nextDebitDate: string
    }
    onConfirm?: () => void
    onEdit?: () => void
}

export function AutoDebitConfirmation({ config, onConfirm, onEdit }: AutoDebitConfirmationProps) {
    const frequencyText = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly'
    }[config.frequency]

    return (
        <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
                <div className="text-center mb-6">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8 text-brand-green" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Auto-Debit Confirmed</h2>
                    <p className="text-sm text-slate-600">Your automatic payments are now set up</p>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <DollarSign className="h-5 w-5 text-brand-green" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-600">Amount</p>
                            <p className="font-bold text-lg">${config.amount.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <Calendar className="h-5 w-5 text-brand-green" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-600">Frequency</p>
                            <p className="font-semibold">{frequencyText}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <CreditCard className="h-5 w-5 text-brand-green" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-600">Payment Method</p>
                            <p className="font-semibold">{config.paymentMethod}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Next Debit Date</p>
                        <p className="text-lg font-bold text-blue-900">
                            {new Date(config.nextDebitDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {onEdit && (
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className="flex-1"
                        >
                            Edit Settings
                        </Button>
                    )}
                    {onConfirm && (
                        <Button
                            onClick={onConfirm}
                            className="flex-1 bg-brand-green hover:bg-emerald-600 text-white"
                        >
                            Got It
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

