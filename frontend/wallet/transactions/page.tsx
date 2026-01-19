/**
 * Transactions Page
 * View complete transaction history with filters
 */

import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TransactionHistory } from '@/components/wallet/transaction-history'
import { PendingTransactions } from '@/components/wallet/pending-transactions'
import { FailedTransactions } from '@/components/wallet/failed-transactions'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Transactions | Wallet | Saver App',
  description: 'View your transaction history',
}

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/wallet" className="inline-block mb-6">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wallet
          </Button>
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">View and manage your transaction history</p>
        </div>

        {/* Alert Sections */}
        <div className="space-y-8">
          {/* Pending Transactions */}
          <section>
            <PendingTransactions />
          </section>

          {/* Failed Transactions */}
          <section>
            <FailedTransactions />
          </section>

          {/* Full Transaction History */}
          <section>
            <TransactionHistory />
          </section>
        </div>
      </div>
    </div>
  )
}
