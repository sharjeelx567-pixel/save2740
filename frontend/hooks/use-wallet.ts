/**
 * Custom hook for wallet data management using React Query
 * Handles fetching, caching, polling, and state management for wallet data
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WalletService } from "@/lib/wallet-service";
import { WalletData, ApiErrorResponse } from "@/lib/types";

interface UseWalletOptions {
  shouldFetch?: boolean;
  pollInterval?: number;
  refetchOnFocus?: boolean;
  refetchOnOnline?: boolean;
}

export function useWallet(
  shouldFetch: boolean = true,
  options: Partial<UseWalletOptions> = {}
) {
  const {
    pollInterval = 30000,
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
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await WalletService.getWalletData();
      if (!response.success || !response.data) {
        throw response.error || new Error('Failed to fetch wallet data');
      }
      return response.data;
    },
    enabled: shouldFetch,
    refetchInterval: false, // PERFORMANCE: Don't auto-poll
    refetchOnWindowFocus: false, // PERFORMANCE: Manual refresh only
    refetchOnReconnect: refetchOnOnline,
    refetchOnMount: false, // PERFORMANCE: Use cached data on navigation
    staleTime: 2 * 60 * 1000, // PERFORMANCE: 2 minutes - reduces refetching
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
  });

  // Map React Query error to our ApiErrorResponse format
  const error: ApiErrorResponse | null = queryError ? {
    error: (queryError as any).message || 'Failed to fetch wallet data',
    code: (queryError as any).code || 'FETCH_ERROR'
  } : null;

  const balance = data?.balance ?? 0;
  const locked = data?.locked ?? 0;
  const availableBalance = data?.availableBalance ?? Math.max(0, balance - locked);

  return {
    data: data || null,
    loading,
    error,
    refetch,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    isStale: false,
    balance,
    locked,
    referral: data?.referral ?? 0,
    availableBalance,
  };
}
