/**
 * Custom hook for transaction data management using React Query
 */

import { useQuery } from "@tanstack/react-query";
import { WalletService } from "@/lib/wallet-service";
import { Transaction, ApiErrorResponse } from "@/lib/types";

interface UseTransactionsOptions {
  type?: string;
  startDate?: string;
  endDate?: string;
  shouldFetch?: boolean;
  limit?: number;
  pollInterval?: number;
  refetchOnFocus?: boolean;
  refetchOnOnline?: boolean;
}

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

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
    dataUpdatedAt
  } = useQuery({
    queryKey: ['transactions', { type, startDate, endDate, limit }],
    queryFn: async () => {
      const response = await WalletService.getTransactions(type, startDate, endDate);

      if (response.success) {
        // Handle nested extraction: apiClient wrapper -> backend extraction -> data property
        let transactions: Transaction[] = [];
        if (response.data && 'data' in response.data && (response.data as any).data?.transactions) {
          transactions = (response.data as any).data.transactions;
        } else if (response.data?.transactions) {
          transactions = response.data.transactions;
        }
        return transactions.slice(0, limit);
      } else {
        throw response.error || new Error("Failed to fetch transactions");
      }
    },
    enabled: shouldFetch,
    refetchInterval: false, // PERFORMANCE: Don't auto-poll transactions
    refetchOnWindowFocus: false, // PERFORMANCE: Manual refresh only
    refetchOnReconnect: refetchOnOnline,
    refetchOnMount: false, // PERFORMANCE: Use cached data
    staleTime: 2 * 60 * 1000, // PERFORMANCE: 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache 10 minutes
  });

  // Map React Query error to our ApiErrorResponse format
  const error: ApiErrorResponse | null = queryError ? {
    error: (queryError as any).message || 'Failed to fetch transactions',
    code: (queryError as any).code || 'FETCH_ERROR'
  } : null;

  return {
    data: data || null,
    loading,
    error,
    refetch,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    isStale: false,
    deposits: data?.filter((tx) => tx.type === "credit" || tx.type === "deposit") ?? [],
  };
}
