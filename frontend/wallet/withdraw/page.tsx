/**
 * Withdraw Page
 * Withdraw funds from wallet
 */

import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WithdrawMoney } from '@/components/wallet/withdraw-money'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Withdraw | Wallet | Saver App',
  description: 'Withdraw funds from your wallet',
}

export default function WithdrawPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/wallet" className="inline-block mb-6">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wallet
          </Button>
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Withdraw Funds</h1>
          <p className="text-gray-600 mt-2">Transfer money from your wallet to your bank account</p>
        </div>

        {/* Withdraw Form */}
        <WithdrawMoney />
      </div>
    </div>
  )
}
