/**
 * Wallet Top-Up Failure Component
 * Displays error message after failed wallet deposit
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle, AlertTriangle, RefreshCw, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

interface TopUpFailureProps {
  amount: number
  error: string
  errorCode?: string
  transactionId?: string
  onRetry?: () => void
  onClose?: () => void
}

export function TopUpFailure({
  amount,
  error,
  errorCode,
  transactionId,
  onRetry,
  onClose
}: TopUpFailureProps) {
  const getErrorExplanation = (code?: string): string => {
    const explanations: Record<string, string> = {
      INSUFFICIENT_FUNDS: 'Your payment method does not have sufficient funds.',
      CARD_DECLINED: 'Your card was declined. Please try a different payment method.',
      LIMIT_EXCEEDED: 'This transaction exceeds your daily or monthly deposit limit.',
      ACCOUNT_FROZEN: 'Your account is temporarily frozen. Please contact support.',
      INVALID_AMOUNT: 'The deposit amount is invalid. Please check and try again.',
      GATEWAY_ERROR: 'Payment gateway error. This is usually temporary, please retry.',
      VERIFICATION_FAILED: 'Payment verification failed. Your payment method may need updating.',
      FRAUD_DETECTED: 'Transaction flagged for security review. Contact support for assistance.',
      NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
      TIMEOUT: 'Request timed out. Please try again.',
    }
    return explanations[code || ''] || 'An unexpected error occurred. Please try again or contact support.'
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          {/* Error Message */}
          <div>
            <h3 className="text-2xl font-bold text-red-900 mb-2">
              Deposit Failed
            </h3>
            <p className="text-red-800">
              We couldn't process your deposit at this time.
            </p>
          </div>

          {/* Amount Attempted */}
          <div className="bg-white rounded-lg p-6 border border-red-200">
            <p className="text-sm text-gray-600 mb-2">Amount Attempted</p>
            <p className="text-4xl font-bold text-red-700">
              ${amount.toFixed(2)}
            </p>
          </div>

          {/* Error Details */}
          <Alert className="bg-red-100 border-red-300 text-left">
            <AlertTriangle className="h-4 w-4 text-red-700" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold mb-2">{error}</p>
              <p className="text-sm">{getErrorExplanation(errorCode)}</p>
            </AlertDescription>
          </Alert>

          {/* Transaction ID if available */}
          {transactionId && (
            <div className="bg-white rounded-lg p-4 border border-red-200 text-left">
              <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {transactionId}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            {onRetry && (
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={onRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const subject = encodeURIComponent(`Failed Deposit - $${amount.toFixed(2)}`)
                  const body = encodeURIComponent(
                    `Transaction ID: ${transactionId || 'N/A'}\nAmount: $${amount.toFixed(2)}\nError: ${error}\nError Code: ${errorCode || 'N/A'}`
                  )
                  window.location.href = `mailto:support@save2740.com?subject=${subject}&body=${body}`
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = 'tel:+1800XXX-XXXX'}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Support
              </Button>
            </div>

            <Link href="/wallet/transactions">
              <Button variant="ghost" className="w-full">
                View Transaction History
              </Button>
            </Link>

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

          {/* Helpful Tips */}
          <div className="bg-white rounded-lg p-4 text-left border border-red-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">What to do next:</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Check that your payment method has sufficient funds</li>
              <li>Verify your payment method details are correct</li>
              <li>Ensure you haven't exceeded your deposit limits</li>
              <li>Try using a different payment method</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

