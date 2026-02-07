"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertTriangle, FileText, Upload } from "lucide-react"
import { toast } from "sonner"

interface PaymentDisputeProps {
    transactionId: string
    amount: number
    onSubmit?: (data: any) => Promise<void>
}

export function PaymentDispute({ transactionId, amount, onSubmit }: PaymentDisputeProps) {
    const [formData, setFormData] = useState({
        reason: '',
        description: '',
        contactEmail: '',
        contactPhone: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!formData.reason || !formData.description) {
            toast.error("Please fill in all required fields")
            return
        }

        setSubmitting(true)
        try {
            if (onSubmit) {
                await onSubmit({
                    transactionId,
                    ...formData
                })
            } else {
                // Default: create support ticket
                toast.success("Dispute submitted. Our team will review it within 24-48 hours.")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit dispute")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    File Payment Dispute
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-600">Transaction ID</span>
                        <span className="font-mono text-sm font-semibold">{transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Amount</span>
                        <span className="font-bold text-lg">${amount.toFixed(2)}</span>
                    </div>
                </div>

                <div>
                    <Label htmlFor="reason">Reason for Dispute *</Label>
                    <select
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1"
                    >
                        <option value="">Select a reason</option>
                        <option value="unauthorized">Unauthorized transaction</option>
                        <option value="duplicate">Duplicate charge</option>
                        <option value="incorrect_amount">Incorrect amount</option>
                        <option value="not_received">Service/product not received</option>
                        <option value="defective">Defective product/service</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Please provide detailed information about your dispute..."
                        rows={5}
                        className="mt-1"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                            id="contactEmail"
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                            id="contactPhone"
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            placeholder="(555) 123-4567"
                        />
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Important Information</p>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>Disputes are typically resolved within 5-10 business days</li>
                                <li>You may be asked to provide additional documentation</li>
                                <li>False disputes may result in account restrictions</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={submitting || !formData.reason || !formData.description}
                    className="w-full bg-brand-green hover:bg-emerald-600 text-white"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Submit Dispute
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}

