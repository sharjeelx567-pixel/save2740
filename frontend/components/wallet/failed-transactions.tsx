/**
 * Failed Transactions Component
 * Displays failed transaction attempts with retry options
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertCircle,
  Loader2,
  XCircle,
  RefreshCw,
  Mail,
} from 'lucide-react'
import { WalletService } from '@/lib/wallet-service'

interface FailedTransaction {
  _id: string
  amount: number
  description: string
  type: 'deposit' | 'withdrawal' | 'transfer'
  status: 'failed'
  failureReason: string
  failureCode: string
  createdAt: string
  retryable: boolean
  retries: number
  maxRetries: number
}

export function FailedTransactions() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<FailedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)

  useEffect(() => {
    const fetchFailedTransactions = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await WalletService.getFailedTransactions()
        if (response.success && response.data) {
          const data = response.data.data || response.data
          setTransactions(data.transactions || [])
        } else {
          const errorMsg = typeof response.error === 'string' ? response.error : (response.error?.error || 'Failed to fetch transactions');
          throw new Error(errorMsg);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load transactions'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchFailedTransactions()
  }, [])

  const handleRetry = async (transactionId: string) => {
    setRetrying(transactionId)

    try {
      const response = await fetch(`/api/wallet/transactions/${transactionId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to retry transaction')
      }

      // Remove retried transaction from list
      setTransactions(prev => prev.filter(t => t._id !== transactionId))

      toast({
        title: 'Success',
        description: 'Transaction retry initiated. Please wait for confirmation.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to retry transaction',
        variant: 'destructive',
      })
    } finally {
      setRetrying(null)
    }
  }

  const getFailureExplanation = (code: string): string => {
    const explanations: Record<string, string> = {
      INSUFFICIENT_FUNDS: 'Your account does not have sufficient funds for this transaction.',
      CARD_DECLINED: 'Your payment method was declined. Please try another card.',
      LIMIT_EXCEEDED: 'This transaction exceeds your daily or monthly limit.',
      ACCOUNT_FROZEN: 'Your account is temporarily frozen. Contact support.',
      INVALID_AMOUNT: 'The transaction amount is invalid.',
      GATEWAY_ERROR: 'Payment gateway error. This is temporary, please retry.',
      VERIFICATION_FAILED: 'Payment verification failed. Your payment method may need updating.',
      FRAUD_DETECTED: 'Transaction flagged for security review. Contact support.',
    }
    return explanations[code] || 'An unexpected error occurred during processing.'
  }

  if (error && !loading) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load transactions</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Failed Transactions</CardTitle>
        <CardDescription>Transaction attempts that did not complete</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No failed transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="p-4 border border-red-200 bg-red-50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">
                        {transaction.type} Failed
                      </p>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-red-200 text-red-900">Failed</Badge>
                </div>

                <div className="space-y-3">
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Amount</p>
                      <p className="font-semibold text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Failure Reason */}
                  <Alert className="bg-red-100 border-red-300">
                    <AlertCircle className="h-4 w-4 text-red-700" />
                    <AlertDescription className="text-red-800 text-sm">
                      <p className="font-semibold mb-1">{transaction.failureReason}</p>
                      <p>{getFailureExplanation(transaction.failureCode)}</p>
                    </AlertDescription>
                  </Alert>

                  {/* Retry Info */}
                  {transaction.retryable ? (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertCircle className="h-4 w-4 text-brand-green" />
                      <AlertDescription className="text-brand-green text-sm">
                        You can retry this transaction.
                        {transaction.retries > 0 && (
                          <span> Attempt {transaction.retries} of {transaction.maxRetries}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        This transaction cannot be retried automatically. Please contact support.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {transaction.retryable && (
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => handleRetry(transaction._id)}
                        disabled={retrying === transaction._id}
                      >
                        {retrying === transaction._id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {retrying === transaction._id ? 'Retrying...' : 'Retry Transaction'}
                      </Button>
                    )}

                    <Button variant="outline" className="flex-1" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

