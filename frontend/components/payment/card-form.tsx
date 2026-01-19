"use client"

import { useState } from "react"
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import { Loader2 } from "lucide-react"

interface CardFormProps {
  onSuccess: (paymentMethodId: string) => void
  onError: (error: string) => void
  isLoading?: boolean
}

export function CardForm({ onSuccess, onError, isLoading = false }: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardholderName, setCardholderName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      onError("Stripe not initialized")
      return
    }

    if (!cardholderName.trim()) {
      onError("Please enter cardholder name")
      return
    }

    setIsProcessing(true)

    try {
      // Get setup intent client secret from server
      const setupResponse = await fetch("/api/payment-methods", {
        method: "POST",
      })

      if (!setupResponse.ok) {
        throw new Error("Failed to create setup intent")
      }

      const { clientSecret } = await setupResponse.json()

      // Confirm setup intent with card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
      })

      if (result.error) {
        onError(result.error.message || "Failed to add card")
      } else if (result.setupIntent?.payment_method) {
        const paymentMethodId = result.setupIntent.payment_method as string
        onSuccess(paymentMethodId)
      } else {
        onError("Unexpected error: No payment method created")
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Doe"
          disabled={isProcessing || isLoading}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">
          Card Details
        </label>
        <div className="px-4 py-3 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-brand-green bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1e293b",
                  "::placeholder": {
                    color: "#cbd5e1",
                  },
                },
                invalid: {
                  color: "#ef4444",
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || isLoading || !stripe || !elements}
        className="w-full px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green/90 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing || isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding Card...
          </>
        ) : (
          "Add Card"
        )}
      </button>
    </form>
  )
}
