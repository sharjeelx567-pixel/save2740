/**
 * Custom hook for wallet data management
 * Handles fetching, caching, polling, and state management for wallet data
 * - Auto-polls wallet data at configurable intervals
 * - Refetches when window regains focus
 * - Handles network reconnection
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { WalletService } from "@/lib/wallet-service";
import { WalletData, ApiErrorResponse } from "@/lib/types";

interface UseWalletOptions {
  shouldFetch?: boolean;
  pollInterval?: number; // milliseconds, default 10000 (10 seconds)
  refetchOnFocus?: boolean; // default true
  refetchOnOnline?: boolean; // default true
}

/**
 * useWallet hook - Real-time wallet data with polling
 * @param options - Configuration options for polling and refetch behavior
 * @returns Object containing wallet data, loading state, error, and refetch function
 */
export function useWallet(
  shouldFetch: boolean = true,
  options: Partial<UseWalletOptions> = {}
) {
  const {
    pollInterval = 30000, // 30 seconds (reduced from 10s to minimize server load)
    refetchOnFocus = true,
    refetchOnOnline = true,
  } = options;

  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch wallet data from API
   */
  const fetchWallet = useCallback(async () => {
    try {
      abortControllerRef.current = new AbortController();
      setError(null);

      const response = await WalletService.getWalletData();

      if (response.success && response.data) {
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error || { error: "Unknown error" });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[useWallet] Fetch error:", err);
        setError({
          error: "Failed to fetch wallet data",
          code: "FETCH_ERROR",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch wallet data manually
   */
  const refetch = useCallback(() => {
    setLoading(true);
    fetchWallet();
  }, [fetchWallet]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!shouldFetch) return;

    // Initial fetch
    fetchWallet();

    // Setup polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchWallet();
    }, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, [shouldFetch, fetchWallet, pollInterval]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      refetch();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnFocus, refetch]);

  // Refetch on network reconnect
  useEffect(() => {
    if (!refetchOnOnline) return;

    const handleOnline = () => {
      refetch();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refetchOnOnline, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    isStale: lastUpdated ? Date.now() - lastUpdated.getTime() > pollInterval : true,
    balance: data?.balance ?? 0,
    locked: data?.locked ?? 0,
    referral: data?.referral ?? 0,
  };
}
