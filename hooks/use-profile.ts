/**
 * useProfile Hook
 * Fetches and manages user profile data with real-time updates
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface ProfileData {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  phoneVerified: boolean
  dateOfBirth: string
  gender: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  profilePicture?: {
    url: string
    uploadedAt: string
  }
  bio: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
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

/**
 * Hook to fetch and manage user profile with auto-refresh
 * Refetches every 30 seconds and on window focus
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProfile = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const { data } = await response.json()
      setProfile(data)
      setError(null)
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
        console.error('Error fetching profile:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Set up polling interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchProfile()
    }, 30 * 1000) // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchProfile])

  // Refetch on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchProfile()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchProfile])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  }
}
