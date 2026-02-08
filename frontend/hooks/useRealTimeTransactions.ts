/**
 * useRealTimeTransactions Hook
 * 
 * Provides real-time transaction data with auto-polling
 * - Auto-polls transaction history at configurable intervals
 * - Refetches when window regains focus
 * - Handles errors gracefully
 * 
 * @example
 * const { transactions, loading, error } = useRealTimeTransactions()
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { API } from '@/lib/constants'

export interface Transaction {
  id: string
  type: 'credit' | 'debit' | 'deposit' | 'withdrawal'
  description: string
  amount: number
  fee: number
  date: string
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
  createdAt: string
}

interface UseRealTimeTransactionsOptions {
  pollInterval?: number
  refetchOnFocus?: boolean
  enabled?: boolean
}

const DEFAULT_POLL_INTERVAL = 15000 // 15 seconds

export function useRealTimeTransactions(options: UseRealTimeTransactionsOptions = {}) {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    refetchOnFocus = true,
    enabled = true,
  } = options

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!enabled) return

    try {
      abortControllerRef.current = new AbortController()
      const token = localStorage.getItem('token')

      const response = await fetch(`${API.BASE_URL}/api/wallet/transactions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error(`Failed to fetch transactions: ${response.status}`)

      const json = await response.json()
      const transactionData = json.data || json
      setTransactions(transactionData.transactions || transactionData || [])
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        console.error('[useRealTimeTransactions] Fetch error:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [enabled])

  // Setup polling
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchTransactions()

    // Setup polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchTransactions()
    }, pollInterval)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      abortControllerRef.current?.abort()
    }
  }, [fetchTransactions, pollInterval, enabled])

  // Refetch on focus
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return

    const handleFocus = () => {
      fetchTransactions()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchTransactions, refetchOnFocus, enabled])

  const refetch = useCallback(() => {
    setLoading(true)
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    loading,
    error,
    refetch,
    lastUpdated,
  }
}
