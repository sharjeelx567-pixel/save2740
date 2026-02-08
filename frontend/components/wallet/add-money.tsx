/**
 * Add Money Component
 * Form for depositing funds into wallet
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, AlertCircle, CreditCard, DollarSign } from 'lucide-react'

interface PaymentMethod {
  _id?: string
  id?: string
  type: 'card' | 'bank_account'
  last4: string
  brand?: string
  bankName?: string
}

interface FormData {
  amount: string
  paymentMethodId: string
  description: string
  savePaymentMethod: boolean
}

interface ValidationErrors {
  [key: string]: string
}

export function AddMoney() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    paymentMethodId: '',
    description: 'Wallet top-up',
    savePaymentMethod: false,
  })

  // Fetch payment methods on mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/payment-methods', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        })

        if (response.ok) {
          const { data } = await response.json()
          setPaymentMethods(data || [])
          if (data?.[0]) {
            setFormData(prev => ({
              ...prev,
              paymentMethodId: data[0]._id || data[0].id,
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    const amount = parseFloat(formData.amount)

    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(amount)) {
      newErrors.amount = 'Amount must be a valid number'
    } else if (amount < 1) {
      newErrors.amount = 'Minimum deposit is $1'
    } else if (amount > 50000) {
      newErrors.amount = 'Maximum deposit is $50,000'
    }

    if (!formData.paymentMethodId) {
      newErrors.paymentMethodId = 'Please select a payment method'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
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
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          paymentMethodId: formData.paymentMethodId,
          description: formData.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process deposit')
      }

      const { data } = await response.json()
      setSuccessData(data)
      setSuccess(true)
      setFormData({
        amount: '',
        paymentMethodId: formData.paymentMethodId,
        description: 'Wallet top-up',
        savePaymentMethod: false,
      })

      toast({
        title: 'Success',
        description: 'Deposit processed successfully',
      })
    } catch (error) {
      console.error('Error processing deposit:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process deposit'
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
      <div className="max-w-md mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-900">Deposit Successful</CardTitle>
            <CardDescription className="text-green-800">
              Your funds have been added
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Amount Deposited</p>
              <p className="text-4xl font-bold text-green-600">
                ${parseFloat(formData.amount).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-gray-900">{successData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Balance</span>
                <span className="font-semibold">${successData.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold text-green-600">Completed</span>
              </div>
            </div>

            {successData.nextSteps && (
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-brand-green" />
                <AlertDescription className="text-brand-green text-sm">
                  <div className="font-semibold mb-1">Next Steps:</div>
                  <ul className="text-xs space-y-1 ml-4">
                    {successData.nextSteps.map((step: string, idx: number) => (
                      <li key={idx}>• {step}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={() => {
                setSuccess(false)
                setSuccessData(null)
              }}
            >
              Add More Funds
            </Button>

            <Button variant="outline" className="w-full">
              View Transaction History
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Money to Wallet</CardTitle>
        <CardDescription>Deposit funds using a linked card or bank account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="1"
                max="50000"
                value={formData.amount}
                onChange={handleChange}
                disabled={processing}
                placeholder="0.00"
                className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount}</p>
            )}
            <p className="text-xs text-gray-500">Min: $1 • Max: $50,000</p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethodId">Payment Method *</Label>
            <select
              id="paymentMethodId"
              name="paymentMethodId"
              value={formData.paymentMethodId}
              onChange={handleChange}
              disabled={processing || paymentMethods.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a payment method</option>
              {paymentMethods.map(method => {
                const methodId = method._id || method.id
                return (
                  <option key={methodId} value={methodId}>
                    {method.type === 'card'
                      ? `${method.brand || 'Card'} •••• ${method.last4}`
                      : `${method.bankName || 'Bank'} •••• ${method.last4}`}
                  </option>
                )
              })}
            </select>
            {errors.paymentMethodId && (
              <p className="text-xs text-red-500">{errors.paymentMethodId}</p>
            )}
          </div>

          {/* No Payment Methods Alert */}
          {paymentMethods.length === 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You need to add a payment method first. Go to settings to add a card or bank account.
              </AlertDescription>
            </Alert>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={processing}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="What is this deposit for?"
            />
          </div>

          {/* Save Payment Method */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="savePaymentMethod"
              name="savePaymentMethod"
              checked={formData.savePaymentMethod}
              onChange={handleChange}
              disabled={processing}
              className="rounded"
            />
            <label htmlFor="savePaymentMethod" className="text-sm text-gray-700 cursor-pointer">
              Save this payment method for future use
            </label>
          </div>

          {/* Fee Notice */}
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-brand-green" />
            <AlertDescription className="text-brand-green text-sm">
              Processing fee: 2.9% + $0.30 will be added to your deposit amount
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={processing || paymentMethods.length === 0}
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? 'Processing...' : `Deposit $${formData.amount || '0.00'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

