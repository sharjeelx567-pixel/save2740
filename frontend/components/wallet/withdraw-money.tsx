/**
 * Withdraw Money Component
 * Form for withdrawing funds from wallet
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useWallet } from '@/hooks/use-wallet'
import { Loader2, AlertCircle, Clock, DollarSign } from 'lucide-react'

interface ValidationErrors {
  [key: string]: string
}

const MIN_WITHDRAWAL = 10
const MAX_WITHDRAWAL = 10000

export function WithdrawMoney() {
  const { toast } = useToast()
  const { data: wallet, refetch } = useWallet()
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethodId: '',
    description: '',
    twoFactorCode: '',
  })
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingMethods, setLoadingMethods] = useState(false)

  React.useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true)
    try {
      const response = await fetch('/api/payment-methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setPaymentMethods(data.data)
        // Auto-select isDefault
        const defaultMethod = data.data.find((m: any) => m.isDefault)
        if (defaultMethod) {
          setFormData(prev => ({ ...prev, paymentMethodId: defaultMethod._id }))
        }
      }
    } catch (err) {
      console.error("Failed to fetch payment methods", err)
    } finally {
      setLoadingMethods(false)
    }
  }

  const availableBalance = wallet?.balance ?? 0

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    const amount = parseFloat(formData.amount)

    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(amount)) {
      newErrors.amount = 'Amount must be a valid number'
    } else if (amount < MIN_WITHDRAWAL) {
      newErrors.amount = `Minimum withdrawal is $${MIN_WITHDRAWAL}`
    } else if (amount > MAX_WITHDRAWAL) {
      newErrors.amount = `Maximum withdrawal is $${MAX_WITHDRAWAL}`
    } else if (amount > availableBalance) {
      newErrors.amount = 'Insufficient available balance'
    }

    if (!formData.paymentMethodId) {
      newErrors.paymentMethodId = 'Please select a withdrawal destination'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)

    try {
      // Generate idempotency key to prevent duplicate withdrawals
      const idempotencyKey = `withdraw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          paymentMethodId: formData.paymentMethodId,
          description: formData.description || 'Wallet withdrawal',
          twoFactorCode: formData.twoFactorCode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process withdrawal')
      }

      const result = await response.json()
      setSuccessData(result)
      setSuccess(true)
      setFormData({
        amount: '',
        paymentMethodId: '',
        description: '',
        twoFactorCode: '',
      })

      // Refresh wallet data to show updated balance
      refetch()

      toast({
        title: 'Success',
        description: 'Withdrawal processed successfully',
      })
    } catch (error) {
      console.error('Error processing withdrawal:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process withdrawal'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  // Success screen
  if (success && successData) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-brand-green" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Withdrawal Pending</h3>
          <p className="text-sm text-gray-600">Your withdrawal is being processed</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Withdrawal Amount</p>
          <p className="text-3xl font-bold text-brand-green">
            ${parseFloat(formData.amount).toFixed(2)}
          </p>
        </div>

        <div className="space-y-2 text-sm bg-slate-50 rounded-lg p-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID</span>
            <span className="font-mono text-gray-900 text-xs">{successData.transactionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-semibold text-brand-green">Pending (3 days)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Arrival</span>
            <span className="font-semibold text-gray-900">
              {new Date(successData.estimatedDelivery).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Alert className="bg-emerald-50 border-emerald-200">
          <AlertCircle className="h-4 w-4 text-brand-green" />
          <AlertDescription className="text-brand-green text-sm">
            {successData.message}
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setSuccess(false)
              setSuccessData(null)
            }}
          >
            Make Another Withdrawal
          </Button>
          <Button
            className="flex-1 bg-brand-green hover:bg-emerald-600"
            onClick={() => window.location.href = '/wallet-transactions'}
          >
            View History
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Balance */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <p className="text-sm text-gray-600 mb-1">Available Balance</p>
        <p className="text-2xl font-bold text-brand-green">
          ${availableBalance.toFixed(2)}
        </p>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Withdrawal Amount *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min={MIN_WITHDRAWAL}
            max={Math.min(MAX_WITHDRAWAL, availableBalance)}
            value={formData.amount}
            onChange={handleChange}
            disabled={processing}
            placeholder="0.00"
            className={`pl-8 ${errors.amount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-brand-green focus:border-brand-green'}`}
          />
        </div>
        {errors.amount && (
          <p className="text-xs text-red-500">{errors.amount}</p>
        )}
        <p className="text-xs text-gray-500">
          Min: ${MIN_WITHDRAWAL} • Max: ${Math.min(MAX_WITHDRAWAL, availableBalance).toFixed(2)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethodId" className="text-sm font-medium text-gray-700">Destination Account *</Label>
        {loadingMethods ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading payment methods...
          </div>
        ) : (
          <select
            id="paymentMethodId"
            name="paymentMethodId"
            value={formData.paymentMethodId}
            onChange={handleChange}
            disabled={processing || loadingMethods}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green ${errors.paymentMethodId ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">Select where to withdraw</option>
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method: any) => (
                <option key={method._id} value={method._id}>
                  {method.name} ({method.type === 'card' ? 'Card' : 'Bank'}) - {method.last4}
                </option>
              ))
            ) : (
              <option value="" disabled>No payment methods found</option>
            )}
          </select>
        )}
        {errors.paymentMethodId && (
          <p className="text-xs text-red-500">{errors.paymentMethodId}</p>
        )}
        {paymentMethods.length === 0 && !loadingMethods && (
          <p className="text-xs text-amber-600 mt-1">
            Please add a payment method in Settings first.
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={processing}
          placeholder="What is this withdrawal for?"
          className="focus:ring-brand-green focus:border-brand-green"
        />
      </div>

      {/* Processing Info */}
      <Alert className="bg-amber-50 border-amber-200 rounded-lg">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          Bank transfers take 2-3 business days to complete. Weekend deposits will be processed on Monday.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-brand-green hover:bg-emerald-600 text-white"
        disabled={processing || availableBalance < MIN_WITHDRAWAL}
      >
        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {processing ? 'Processing...' : `Withdraw $${formData.amount || '0.00'}`}
      </Button>
    </form>
  )
}

