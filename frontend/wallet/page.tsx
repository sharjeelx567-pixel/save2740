/**
 * Wallet Home Page
 * Main wallet dashboard page
 */

import React from 'react'
import { Metadata } from 'next'
import { WalletHome } from '@/components/wallet/wallet-home'
import { WalletFreezeNotice } from '@/components/wallet/wallet-freeze-notice'

export const metadata: Metadata = {
  title: 'Wallet | Saver App',
  description: 'Manage your wallet, view balance, and track transactions',
}

export default function WalletPage() {
  // In a real app, you would fetch the wallet data here
  // For now, we'll use the client-side hooks

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-600 mt-2">Manage your balance and transactions</p>
        </div>

        {/* Wallet Freeze Notice - will only show if frozen */}
        <div className="mb-8">
          <WalletFreezeNotice frozen={false} />
        </div>

        {/* Main Wallet Dashboard */}
        <WalletHome />
      </div>
    </div>
  )
}
