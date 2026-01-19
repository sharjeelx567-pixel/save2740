/**
 * useWalletLimits Hook
 * Fetches and caches wallet transaction limits
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

export interface WalletLimits {
  dailyDepositLimit: number
  dailyDepositUsed: number
  dailyWithdrawalLimit: number
  dailyWithdrawalUsed: number
  monthlyDepositLimit: number
  monthlyDepositUsed: number
  monthlyWithdrawalLimit: number
  monthlyWithdrawalUsed: number
  minDepositAmount: number
  maxDepositAmount: number
  minWithdrawalAmount: number
  maxWithdrawalAmount: number
  singleTransactionLimit: number
  dailyResetTime: string
  monthlyResetDate: number
  accountStatus: 'unverified' | 'verified' | 'premium'
}

interface UseWalletLimitsReturn {
  limits: WalletLimits | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useWalletLimits(): UseWalletLimitsReturn {
  const [limits, setLimits] = useState<WalletLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLimits = useCallback(async () => {
    try {
      const response = await fetch('/api/wallet/limits', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch wallet limits')
      }

      const data = await response.json()
      setLimits(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching wallet limits:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLimits()

    // Poll limits every 30 seconds (less frequently than wallet balance)
    const interval = setInterval(fetchLimits, 30000)

    // Refetch on window focus
    const handleFocus = () => {
      fetchLimits()
    }

    window.addEventListener('focus', handleFocus)

    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchLimits])

  return {
    limits,
    loading,
    error,
    refetch: fetchLimits,
  }
}
