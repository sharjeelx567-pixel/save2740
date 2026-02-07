/**
 * Wallet Top-Up Success Component
 * Displays success message after successful wallet deposit
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, Download, Mail } from 'lucide-react'
import Link from 'next/link'

interface TopUpSuccessProps {
  amount: number
  transactionId?: string
  newBalance?: number
  onClose?: () => void
  onViewTransaction?: () => void
}

export function TopUpSuccess({
  amount,
  transactionId,
  newBalance,
  onClose,
  onViewTransaction
}: TopUpSuccessProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              Deposit Successful!
            </h3>
            <p className="text-green-800">
              Your wallet has been topped up successfully.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Amount Deposited</p>
            <p className="text-4xl font-bold text-green-700">
              ${amount.toFixed(2)}
            </p>
            {newBalance !== undefined && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">New Balance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${newBalance.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          {transactionId && (
            <div className="bg-white rounded-lg p-4 border border-green-200 text-left">
              <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {transactionId}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3 pt-4">
            {onViewTransaction ? (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={onViewTransaction}
              >
                View Transaction
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Link href="/wallet/transactions">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  View Transaction History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.print()}
              >
                <Download className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const subject = encodeURIComponent(`Receipt for Deposit of $${amount.toFixed(2)}`)
                  const body = encodeURIComponent(
                    `Transaction ID: ${transactionId || 'N/A'}\nAmount: $${amount.toFixed(2)}\nNew Balance: $${newBalance?.toFixed(2) || 'N/A'}`
                  )
                  window.location.href = `mailto:support@save2740.com?subject=${subject}&body=${body}`
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Receipt
              </Button>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
          <div className="bg-green-100 rounded-lg p-4 text-left">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> Your funds are now available in your wallet. 
              You can use them immediately for transactions, transfers, or withdrawals.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

