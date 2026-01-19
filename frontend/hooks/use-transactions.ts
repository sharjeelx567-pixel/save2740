/**
 * Custom hook for transaction data management
 * Handles fetching, polling, and state management for wallet transactions
 * - Auto-polls transaction history at configurable intervals
 * - Refetches when window regains focus
 * - Handles network reconnection
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { WalletService } from "@/lib/wallet-service";
import { Transaction, ApiErrorResponse } from "@/lib/types";

interface UseTransactionsOptions {
  type?: string;
  startDate?: string;
  endDate?: string;
  shouldFetch?: boolean;
  limit?: number;
  pollInterval?: number; // milliseconds, default 15000 (15 seconds)
  refetchOnFocus?: boolean; // default true
  refetchOnOnline?: boolean; // default true
}

/**
 * useTransactions hook - Real-time transaction data with polling
 * @param options - Configuration options for fetching and polling transactions
 * @returns Object containing transactions, loading state, error, and refetch function
 */
export function useTransactions(options: UseTransactionsOptions = {}) {
  const {
    type,
    startDate,
    endDate,
    shouldFetch = true,
    limit = 10,
    pollInterval = 15000,
    refetchOnFocus = true,
    refetchOnOnline = true,
  } = options;

  const [data, setData] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch transactions from API
   */
  const fetchTransactions = useCallback(async () => {
    try {
      abortControllerRef.current = new AbortController();
      setError(null);

      const response = await WalletService.getTransactions(
        type,
        startDate,
        endDate
      );

      if (response.success && response.data) {
        const transactions = response.data.transactions.slice(0, limit);
        setData(transactions);
        setLastUpdated(new Date());
      } else {
        setError(response.error || { error: "Unknown error" });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[useTransactions] Fetch error:", err);
        setError({
          error: "Failed to fetch transactions",
          code: "FETCH_ERROR",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [type, startDate, endDate, limit]);

  /**
   * Refetch transactions manually
   */
  const refetch = useCallback(() => {
    setLoading(true);
    fetchTransactions();
  }, [fetchTransactions]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!shouldFetch) return;

    // Initial fetch
    fetchTransactions();

    // Setup polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchTransactions();
    }, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, [shouldFetch, fetchTransactions, pollInterval]);

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
    deposits: data?.filter((tx) => tx.type === "credit" || tx.type === "deposit") ?? [],
  };
}
