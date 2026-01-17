/**
 * useRealTimeWallet Hook
 * 
 * Provides real-time wallet data with auto-polling, refetch on focus, and error handling
 * - Auto-polls wallet data at configurable intervals
 * - Refetches when window regains focus
 * - Handles authentication with token from localStorage
 * - Provides manual refetch capability
 * 
 * @example
 * const { data, loading, error, refetch } = useRealTimeWallet()
 */

import { useEffect, useState, useCallback, useRef } from 'react'

export interface WalletData {
  balance: number
  availableBalance: number
  locked: number
  lockedInPockets: number
  referral: number
  referralEarnings: number
  totalBalance: number
  lastDailySavingDate: string
  currentStreak: number
  dailySavingAmount: number
  userId: string
}

interface UseRealTimeWalletOptions {
  pollInterval?: number // ms between polls, default 10000 (10 seconds)
  refetchOnFocus?: boolean // refetch when window gets focus, default true
  refetchOnReconnect?: boolean // refetch when network reconnects, default true
  enabled?: boolean // enable/disable polling, default true
}

const DEFAULT_POLL_INTERVAL = 30000 // 30 seconds (reduced from 10s to minimize server load)

export function useRealTimeWallet(options: UseRealTimeWalletOptions = {}) {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    refetchOnFocus = true,
    refetchOnReconnect = true,
    enabled = true,
  } = options

  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch wallet data
  const fetchWallet = useCallback(async () => {
    if (!enabled) return

    try {
      abortControllerRef.current = new AbortController()
      const token = localStorage.getItem('token')

      const response = await fetch('/api/wallet', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error(`Failed to fetch wallet: ${response.status}`)

      const walletData: WalletData = await response.json()
      setData(walletData)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        console.error('[useRealTimeWallet] Fetch error:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [enabled])

  // Setup polling
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchWallet()

    // Setup polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchWallet()
    }, pollInterval)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      abortControllerRef.current?.abort()
    }
  }, [fetchWallet, pollInterval, enabled])

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return

    const handleFocus = () => {
      fetchWallet()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchWallet, refetchOnFocus, enabled])

  // Refetch on network reconnect
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return

    const handleOnline = () => {
      fetchWallet()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [fetchWallet, refetchOnReconnect, enabled])

  const refetch = useCallback(() => {
    setLoading(true)
    fetchWallet()
  }, [fetchWallet])

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    isStale: lastUpdated ? Date.now() - lastUpdated.getTime() > pollInterval : true,
  }
}
