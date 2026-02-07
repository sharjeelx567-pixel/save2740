'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // PERFORMANCE: Data fresh for 2 minutes - reduces refetching
                        staleTime: 2 * 60 * 1000,
                        // Keep unused data in cache for 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Retry failed requests once with backoff
                        retry: 1,
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
                        // PERFORMANCE: Don't refetch on window focus by default
                        refetchOnWindowFocus: false,
                        // PERFORMANCE: Don't refetch on mount if data exists and is fresh
                        refetchOnMount: false,
                        // Refetch on reconnect for offline recovery
                        refetchOnReconnect: true,
                        // Network mode: always try (good for instant navigation)
                        networkMode: 'offlineFirst',
                    },
                    mutations: {
                        retry: 1,
                        networkMode: 'offlineFirst',
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    )
}
