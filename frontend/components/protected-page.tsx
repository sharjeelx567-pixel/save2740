/**
 * Authentication Guard HOC
 * Protects pages from unauthenticated access
 * Redirects to login if no auth token found
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { API } from '@/lib/constants'

// Lazy load chat widget to reduce initial bundle size
const SupportChatWidget = dynamic(
  () => import('@/components/support-chat-widget').then(mod => mod.SupportChatWidget),
  { ssr: false }
)

interface ProtectedPageProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedPage({ children, fallback }: ProtectedPageProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const attemptRefresh = async (): Promise<boolean> => {
      try {
        const res = await fetch(`${API.BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.accessToken) {
            localStorage.setItem('token', data.data.accessToken);
            return true;
          }
        }
      } catch (e) {
        console.error('Refresh attempt failed', e);
      }
      return false;
    };

    const verifyTokenInBackground = async (token: string) => {
      try {
        const response = await fetch(`${API.BASE_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          // Token might be expired, try refresh
          const refreshed = await attemptRefresh();
          if (!refreshed) {
            console.log('Background verification failed');
            localStorage.removeItem('token');
            setIsAuthenticated(false); // Revert optimistic update
            router.push('/auth/login');
          }
        }
      } catch (err) {
        console.error('Background token verification error:', err);
        // On network error, we usually keep the user logged in locally
        // or try refresh. Let's try refresh to be safe.
        const refreshed = await attemptRefresh();
        if (!refreshed) {
          // Only redirect if we are sure we can't refresh
          // For network errors specifically, we might want to stay on page (offline mode)
          // But here we'll assume auth failure.
        }
      }
    };

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          // No local token, try strict refresh first (slower but necessary)
          const refreshed = await attemptRefresh();
          if (!refreshed) {
            router.push('/auth/login');
            return;
          }
          // Refresh success
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // OPTIMISTIC UPDATE: Local token exists, render immediately!
        setIsAuthenticated(true);
        setIsLoading(false);

        // Verify in background
        verifyTokenInBackground(token);

      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router])

  // Show fallback while loading
  if (isLoading) {
    return fallback || null
  }

  // Only show content if authenticated
  return isAuthenticated ? (
    <>
      {children}
      <SupportChatWidget />
    </>
  ) : null
}

export default ProtectedPage

