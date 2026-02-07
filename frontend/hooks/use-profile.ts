import { useQuery, useQueryClient } from '@tanstack/react-query'
import { API } from '@/lib/constants'
import { useEffect } from 'react'

export interface ProfileData {
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  phone?: string // Alternative field name from backend
  phoneVerified?: boolean
  emailVerified: boolean
  dateOfBirth?: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  profileImage?: string
  profilePicture?: {
    url: string
    uploadedAt: string
  }
  bio?: string
  preferences?: {
    notifications?: {
      email?: boolean
      push?: boolean
      sms?: boolean
      marketing?: boolean
      security?: boolean
    }
    language?: string
    currency?: string
  }
  accountTier: 'basic' | 'pro' | 'business'
  updatedAt: string
}

interface UseProfileReturn {
  profile: ProfileData | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const queryClient = useQueryClient()
  
  // Get current token to include in query key (so cache invalidates on token change)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Invalidate profile cache when token changes
  useEffect(() => {
    if (!token) {
      // Clear profile cache when logged out
      queryClient.removeQueries({ queryKey: ['profile'] })
    }
  }, [token, queryClient])

  const { data, isLoading, error, refetch } = useQuery({
    // Include token hash in query key so cache invalidates on user change
    queryKey: ['profile', token ? token.slice(-10) : 'none'],
    queryFn: async () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!currentToken) return null;

      const response = await fetch(`${API.BASE_URL}/api/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('session');
          localStorage.removeItem('userId');
          window.location.href = '/auth/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const resData = await response.json();
      return resData.data as ProfileData;
    },
    enabled: typeof window !== 'undefined' && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter to ensure fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchInterval: false, // Don't auto-refetch, only on demand
    refetchOnWindowFocus: false, // Don't refetch on every window focus
    refetchOnMount: true, // DO refetch on mount to get fresh data
    retry: 1,
  });

  return {
    profile: data || null,
    loading: isLoading,
    error: error as Error | null,
    refetch: async () => { await refetch(); },
  }
}
