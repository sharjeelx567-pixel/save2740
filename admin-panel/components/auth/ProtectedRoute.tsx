'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🔒 ProtectedRoute check:', { loading, hasUser: !!user, userEmail: user?.email })
    
    if (!loading && !user) {
      console.log('❌ Not authenticated, redirecting to login...')
      router.push('/login')
    } else if (!loading && user) {
      console.log('✅ User authenticated:', user.email)
    }
  }, [user, loading, router])

  if (loading) {
    console.log('⏳ Auth loading...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('❌ No user, showing null')
    return null
  }

  console.log('✅ Rendering protected content for:', user.email)
  return <>{children}</>
}
