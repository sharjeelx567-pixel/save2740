/**
 * Authentication Guard HOC
 * Protects pages from unauthenticated access
 * Redirects to login if no auth token found
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

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
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          console.log('No token found in localStorage');
          router.push('/auth/login');
          return;
        }

        // Verify token is valid with backend
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.log('Token verification failed:', response.status);
          localStorage.removeItem('token');
          // Token invalid, redirect to login
          router.push('/auth/login')
          return
        }

        // Token valid, allow access
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Show fallback while loading - keep it minimal for speed
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
