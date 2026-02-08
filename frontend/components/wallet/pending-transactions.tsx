/**
 * Pending Transactions Component
 * Displays transactions currently being processed
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
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { WalletService } from '@/lib/wallet-service'

interface PendingTransaction {
  _id: string
  amount: number
  description: string
  type: 'deposit' | 'withdrawal' | 'transfer'
  status: 'pending'
  createdAt: string
  estimatedCompletion: string
  progress: number
  cancellable: boolean
}

export function PendingTransactions() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<PendingTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    const fetchPendingTransactions = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await WalletService.getPendingTransactions()
        if (response.success && response.data) {
          const data = response.data.data || response.data
          setTransactions(data.transactions || [])
        } else {
          const errorMsg = typeof response.error === 'string' ? response.error : (response.error?.error || 'Failed to fetch pending transactions');
          throw new Error(errorMsg);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load transactions'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingTransactions()

    // Auto-refresh pending transactions every 10 seconds
    const interval = setInterval(fetchPendingTransactions, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleCancel = async (transactionId: string) => {
    setCancelling(transactionId)

    try {
      const response = await fetch(`/api/wallet/transactions/${transactionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to cancel transaction')
      }

      // Remove cancelled transaction from list
      setTransactions(prev => prev.filter(t => t._id !== transactionId))

      toast({
        title: 'Success',
        description: 'Transaction cancelled successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel transaction',
        variant: 'destructive',
      })
    } finally {
      setCancelling(null)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await WalletService.getPendingTransactions()
      if (response.success && response.data) {
        const data = response.data.data || response.data
        setTransactions(data.transactions || [])
        toast({
          title: 'Success',
          description: 'Transactions updated',
        })
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error)
    } finally {
      setLoading(false)
    }
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
          <Button className="mt-4" onClick={handleRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>Transactions currently being processed</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pending transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {transaction.type} in Progress
                    </p>
                    <p className="text-sm text-gray-600">{transaction.description}</p>
                  </div>
                  <Badge className="bg-yellow-200 text-yellow-900">Pending</Badge>
                </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{transaction.progress}%</span>
                    </div>
                    <div className="w-full bg-yellow-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-yellow-600 transition-all"
                        style={{ width: `${transaction.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Amount</p>
                      <p className="font-semibold text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Estimated Completion</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(transaction.estimatedCompletion).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Info Message */}
                  <Alert className="bg-white border-yellow-300">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-sm">
                      {transaction.type === 'withdrawal'
                        ? 'Bank transfers typically take 2-3 business days. Weekend transactions will be processed Monday.'
                        : 'Your transaction is being verified. This usually takes 5-10 minutes.'}
                    </AlertDescription>
                  </Alert>

                  {/* Actions */}
                  {transaction.cancellable && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      size="sm"
                      onClick={() => handleCancel(transaction._id)}
                      disabled={cancelling === transaction._id}
                    >
                      {cancelling === transaction._id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {cancelling === transaction._id ? 'Cancelling...' : 'Cancel Transaction'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

