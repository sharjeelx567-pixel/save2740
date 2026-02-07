/**
 * Stripe Card Form Component - PCI Compliant
 * 
 * FLOW:
 * 1. User enters card details in Stripe Elements (card data NEVER touches our server)
 * 2. On submit, we request SetupIntent from backend
 * 3. We confirm the SetupIntent with Stripe directly
 * 4. On success, we send only the payment_method_id to backend
 * 5. Backend saves card metadata (brand, last4, exp) - NEVER the full card number
 * 
 * HANDLES:
 * - Normal card flow
 * - 3D Secure / SCA authentication
 * - Card validation errors
 * - Network errors
 */

"use client"

import { useState, useEffect } from "react"
import { useStripe, useElements, CardElement, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js"
import { Loader2, CreditCard, Lock, CheckCircle, AlertCircle } from "lucide-react"

interface CardFormProps {
  onSuccess: (paymentMethodId: string, cardDetails: CardDetails) => void
  onError: (error: string) => void
  isLoading?: boolean
  setAsDefault?: boolean
}

interface CardDetails {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

type FormStatus = 'idle' | 'creating_setup' | 'confirming' | 'saving' | 'success' | 'error'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true, // We collect this separately if needed
}

export function CardFormV2({ 
  onSuccess, 
  onError, 
  isLoading = false,
  setAsDefault = true 
}: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [cardholderName, setCardholderName] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  // Reset error when user starts typing
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete)
    if (event.error) {
      setErrorMessage(event.error.message)
    } else {
      setErrorMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      onError("Payment system not ready. Please refresh and try again.")
      return
    }

    if (!cardholderName.trim()) {
      setErrorMessage("Please enter the cardholder name")
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError("Card input not found")
      return
    }

    setErrorMessage(null)
    
    try {
      // STEP 1: Get SetupIntent from our backend
      setStatus('creating_setup')
      
      const token = localStorage.getItem('token')
      const setupResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/payment-methods/setup-intent`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to initialize card setup")
      }

      const { data: setupData } = await setupResponse.json()
      const { clientSecret } = setupData

      if (!clientSecret) {
        throw new Error("No client secret received")
      }

      // STEP 2: Confirm SetupIntent with Stripe
      // This is where Stripe Elements securely handles the card data
      setStatus('confirming')

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName.trim(),
            },
          },
        }
      )

      // Handle 3D Secure or other authentication flows
      if (confirmError) {
        // User cancelled 3DS or card was declined
        if (confirmError.type === 'card_error' || confirmError.type === 'validation_error') {
          throw new Error(confirmError.message || 'Card verification failed')
        }
        throw new Error(confirmError.message || 'Authentication failed')
      }

      if (!setupIntent) {
        throw new Error("Setup confirmation failed")
      }

      // Handle different SetupIntent statuses
      if (setupIntent.status === 'requires_action') {
        // This shouldn't happen after confirmCardSetup, but handle it
        throw new Error("Additional authentication required. Please try again.")
      }

      if (setupIntent.status !== 'succeeded') {
        throw new Error(`Unexpected status: ${setupIntent.status}`)
      }

      const paymentMethodId = setupIntent.payment_method as string
      if (!paymentMethodId) {
        throw new Error("No payment method created")
      }

      // STEP 3: Save payment method to our backend
      setStatus('saving')

      // Re-fetch token in case it changed during 3DS flow
      const currentToken = localStorage.getItem('token')
      if (!currentToken) {
        throw new Error("Session expired. Please log in again.")
      }

      const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/payment-methods/confirm`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentMethodId,
          isDefault: setAsDefault
        })
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to save payment method")
      }

      const { data: savedMethod } = await confirmResponse.json()

      // SUCCESS!
      setStatus('success')
      
      onSuccess(paymentMethodId, {
        brand: savedMethod.brand,
        last4: savedMethod.last4,
        expMonth: savedMethod.expMonth,
        expYear: savedMethod.expYear
      })

    } catch (error) {
      setStatus('error')
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      setErrorMessage(message)
      onError(message)
    }
  }

  const isProcessing = status !== 'idle' && status !== 'success' && status !== 'error'

  const getStatusMessage = () => {
    switch (status) {
      case 'creating_setup': return 'Initializing secure connection...'
      case 'confirming': return 'Verifying card...'
      case 'saving': return 'Saving payment method...'
      case 'success': return 'Card added successfully!'
      default: return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Security Badge */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <Lock className="w-3 h-3" />
        <span>256-bit SSL encrypted • PCI-DSS compliant</span>
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Name as it appears on card"
          disabled={isProcessing || isLoading}
          autoComplete="cc-name"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
        />
      </div>

      {/* Card Element */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">
          Card Details
        </label>
        <div className={`px-4 py-3.5 border rounded-lg bg-white transition-colors ${
          errorMessage 
            ? 'border-red-300 ring-2 ring-red-100' 
            : 'border-slate-300 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-500'
        }`}>
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Status Message */}
      {isProcessing && getStatusMessage() && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <p className="text-sm text-blue-700">{getStatusMessage()}</p>
        </div>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-700">Card added successfully!</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing || isLoading || !stripe || !cardComplete}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Add Card
          </>
        )}
      </button>

      {/* Test Mode Notice */}
      {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test') && (
        <div className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            🧪 Test Mode - Use card <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code>
          </p>
        </div>
      )}
    </form>
  )
}

export default CardFormV2
