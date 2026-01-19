/**
 * Escrow Balance Component
 * Displays funds held in escrow (dispute/security holds)
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertCircle,
  Loader2,
  Lock,
  Clock,
  Shield,
} from 'lucide-react'

interface EscrowTransaction {
  id: string
  amount: number
  reason: 'dispute' | 'security_hold' | 'payment_hold' | 'chargeback'
  description: string
  holdDate: string
  releaseDate: string
  status: 'held' | 'released' | 'disputed'
  relatedTransaction?: string
}

interface EscrowBalance {
  totalEscrow: number
  currency: string
  transactions: EscrowTransaction[]
  releaseDate?: string
}

export function EscrowBalance() {
  const { toast } = useToast()
  const [escrow, setEscrow] = useState<EscrowBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEscrow = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/wallet/escrow', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch escrow balance')
        }

        const result = await response.json()
        setEscrow(result)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load escrow'
        setError(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEscrow()

    // Refresh escrow balance every 30 seconds
    const interval = setInterval(fetchEscrow, 30000)

    return () => clearInterval(interval)
  }, [toast])

  const getReasumBadge = (reason: string) => {
    switch (reason) {
      case 'dispute':
        return <Badge className="bg-red-100 text-red-800">Dispute Hold</Badge>
      case 'security_hold':
        return <Badge className="bg-orange-100 text-orange-800">Security Hold</Badge>
      case 'payment_hold':
        return <Badge className="bg-yellow-100 text-yellow-800">Payment Hold</Badge>
      case 'chargeback':
        return <Badge className="bg-red-200 text-red-900">Chargeback</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getReasonExplanation = (reason: string): string => {
    switch (reason) {
      case 'dispute':
        return 'This amount is held while a transaction dispute is being reviewed.'
      case 'security_hold':
        return 'Funds held temporarily for security verification of this transaction.'
      case 'payment_hold':
        return 'Funds held pending payment settlement confirmation.'
      case 'chargeback':
        return 'Funds held while a chargeback claim is being investigated.'
      default:
        return 'Funds are temporarily held.'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load escrow</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!escrow) return null

  return (
    <div className="space-y-6">
      {/* Total Escrow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-brand-green" />
            Escrow Balance
          </CardTitle>
          <CardDescription>Funds currently held in escrow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-2">Total in Escrow</p>
            <p className="text-5xl font-bold text-brand-green">
              {escrow.currency}
              {escrow.totalEscrow.toFixed(2)}
            </p>
            {escrow.totalEscrow > 0 && (
              <p className="text-sm text-gray-600 mt-4">
                These funds are held temporarily and will be released when their hold period expires.
              </p>
            )}
          </div>

          {escrow.totalEscrow === 0 && (
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                You have no funds in escrow. All your money is available.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Escrow Transactions */}
      {escrow.transactions && escrow.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Hold Details
            </CardTitle>
            <CardDescription>Individual holds and their release dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {escrow.transactions.map((transaction) => {
              const releaseDate = new Date(transaction.releaseDate)
              const now = new Date()
              const daysRemaining = Math.ceil(
                (releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )

              return (
                <div
                  key={transaction.id}
                  className={`p-4 border rounded-lg ${
                    transaction.status === 'held'
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getReasonExplanation(transaction.reason)}
                      </p>
                    </div>
                    {getReasumBadge(transaction.reason)}
                  </div>

                  <div className="space-y-2">
                    {/* Amount */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Hold Amount</span>
                      <span className="font-semibold text-gray-900">
                        {escrow.currency}
                        {transaction.amount.toFixed(2)}
                      </span>
                    </div>

                    {/* Hold Date */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Hold Date</span>
                      <span className="text-gray-900">
                        {new Date(transaction.holdDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Release Info */}
                    {transaction.status === 'held' && daysRemaining > 0 && (
                      <div className="flex justify-between items-center text-sm bg-white rounded px-3 py-2">
                        <span className="text-gray-600">Expected Release</span>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {releaseDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {daysRemaining} days remaining
                          </p>
                        </div>
                      </div>
                    )}

                    {transaction.status === 'released' && (
                      <Alert className="bg-green-50 border-green-200">
                        <Shield className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 text-sm">
                          This hold was released on {new Date(transaction.releaseDate).toLocaleDateString()}
                        </AlertDescription>
                      </Alert>
                    )}

                    {transaction.status === 'disputed' && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-sm">
                          This transaction is under dispute review. Your funds remain held until resolution.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Related Transaction */}
                    {transaction.relatedTransaction && (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        <span>Transaction ID: </span>
                        <span className="font-mono">{transaction.relatedTransaction}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert className="bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-brand-green" />
        <AlertDescription className="text-brand-green text-sm">
          <p className="font-semibold mb-1">What is escrow?</p>
          <p>
            Escrow is a temporary hold placed on funds for security purposes. Common reasons include:
            transaction verification, chargeback protection, dispute resolution, and fraud prevention.
            Funds are automatically released when the hold period expires or the issue is resolved.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}
