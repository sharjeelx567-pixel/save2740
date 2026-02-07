"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface AutoDebitConfig {
    enabled: boolean
    amount: number
    frequency: 'daily' | 'weekly' | 'monthly'
    paymentMethodId: string | null
    nextDebitDate: string
}

interface PaymentMethod {
    _id: string
    name: string
    last4: string
    type: 'card' | 'bank_account'
}

export function AutoDebitSetup() {
    const [config, setConfig] = useState<AutoDebitConfig | null>(null)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        enabled: false,
        amount: 27.40,
        frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
        paymentMethodId: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [configRes, methodsRes] = await Promise.all([
                apiClient.get<AutoDebitConfig>('/api/payments/auto-debit'),
                apiClient.get<PaymentMethod[]>('/api/payment-methods')
            ])

            if (configRes.success && configRes.data) {
                setConfig(configRes.data)
                setFormData({
                    enabled: configRes.data.enabled,
                    amount: configRes.data.amount,
                    frequency: configRes.data.frequency,
                    paymentMethodId: configRes.data.paymentMethodId || ''
                })
            }

            if (methodsRes.success && methodsRes.data) {
                setPaymentMethods(methodsRes.data)
            }
        } catch (err) {
            console.error("Failed to fetch data:", err)
            toast.error("Failed to load auto-debit settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (formData.enabled && !formData.paymentMethodId) {
            toast.error("Please select a payment method")
            return
        }

        setSaving(true)
        try {
            const response = await apiClient.post('/api/payments/auto-debit', {
                enabled: formData.enabled,
                amount: formData.amount,
                frequency: formData.frequency,
                paymentMethodId: formData.paymentMethodId || null
            })

            if (response.success) {
                toast.success(formData.enabled ? "Auto-debit enabled" : "Auto-debit disabled")
                await fetchData()
            } else {
                throw new Error(typeof response.error === 'string' ? response.error : 'Failed to save')
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save auto-debit settings")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-brand-green" />
                    Auto-Debit Setup
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="enabled"
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                        className="rounded"
                    />
                    <Label htmlFor="enabled" className="cursor-pointer font-semibold">
                        Enable Auto-Debit
                    </Label>
                </div>

                {formData.enabled && (
                    <>
                        <div>
                            <Label htmlFor="amount">Amount (USD)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                min="1"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <select
                                id="frequency"
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            {paymentMethods.length > 0 ? (
                                <select
                                    id="paymentMethod"
                                    value={formData.paymentMethodId}
                                    onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Select payment method</option>
                                    {paymentMethods.map((method) => (
                                        <option key={method._id} value={method._id}>
                                            {method.name} •••• {method.last4}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
                                    <p className="text-sm text-slate-500 mb-2">No payment methods</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = '/payment-methods'}
                                    >
                                        Add Payment Method
                                    </Button>
                                </div>
                            )}
                        </div>

                        {config && formData.enabled && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold text-green-900">Next Debit</span>
                                </div>
                                <p className="text-sm text-green-800">
                                    ${formData.amount.toFixed(2)} will be debited {formData.frequency === 'daily' ? 'daily' : formData.frequency === 'weekly' ? 'weekly' : 'monthly'}
                                </p>
                                {config.nextDebitDate && (
                                    <p className="text-xs text-green-700 mt-1">
                                        Next debit: {new Date(config.nextDebitDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-brand-green hover:bg-emerald-600 text-white"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Settings"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}

