/**
 * Add Debit Card Modal - PCI Compliant
 * 
 * Uses Stripe Elements for secure card collection.
 * Card data NEVER touches our servers - goes directly to Stripe.
 * 
 * FLOW:
 * 1. User enters card in Stripe CardElement (hosted by Stripe)
 * 2. On submit, we request SetupIntent from backend (/api/payment-methods/setup-intent)
 * 3. Stripe.js confirms the SetupIntent (handles 3DS if needed)
 * 4. On success, we send only the payment_method_id to backend (/api/payment-methods/confirm)
 * 5. Backend saves card metadata (brand, last4, exp) - NEVER the full card number
 */

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import CardFormV2 from "@/components/payment/card-form-v2"

// Load Stripe outside of component to avoid recreating on each render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface AddDebitCardModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddDebitCardModal({ isOpen, onClose, onSuccess }: AddDebitCardModalProps) {
    const [loading, setLoading] = useState(false)

    const handleSuccess = (paymentMethodId: string, cardDetails: { brand: string; last4: string; expMonth: number; expYear: number }) => {
        toast.success(`${cardDetails.brand.toUpperCase()} card ending in ${cardDetails.last4} added successfully`)
        onSuccess()
        onClose()
    }

    const handleError = (error: string) => {
        toast.error(error)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-brand-green" />
                        Add Debit Card
                    </DialogTitle>
                    <DialogDescription>
                        Securely add a debit card for quick payments
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Stripe Elements Provider */}
                    <Elements stripe={stripePromise}>
                        <CardFormV2 
                            onSuccess={handleSuccess}
                            onError={handleError}
                            isLoading={loading}
                            setAsDefault={true}
                        />
                    </Elements>
                </div>
            </DialogContent>
        </Dialog>
    )
}

