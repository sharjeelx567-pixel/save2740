'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, tokenManager } from '@/lib/api'
import { adminFCMService } from '@/lib/fcm-service'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string, mfaToken?: string) => Promise<{ mfaRequired?: boolean } | void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    // Disable FCM initialization on page load - it's causing issues
  }, [])

  const checkAuth = async () => {
    try {
      console.log('🔐 Checking auth...')
      let token = tokenManager.get()

      // If no token, attempt to refresh first
      if (!token) {
        console.log('⚠️ No access token found, attempting to use refresh token...')
        try {
          const refreshResponse = await authAPI.refresh()
          if (refreshResponse.success && refreshResponse.data?.accessToken) {
            console.log('✅ Initial refresh successful')
            tokenManager.set(refreshResponse.data.accessToken)
            token = refreshResponse.data.accessToken
          }
        } catch (refreshError) {
          console.log('❌ Initial refresh failed')
          // Don't setup user, just finish loading. 
          // If on protected route, Auth components may handle redirect, 
          // or api.ts may have already triggered redirect.
          setLoading(false)
          return
        }
      }

      if (token) {
        console.log('✅ Token available, validating user...')
        const response = await authAPI.me()
        console.log('📥 /me response:', response)

        if (response.success && response.data) {
          console.log('✅ Setting user:', response.data)
          setUser(response.data)
        } else {
          console.log('❌ /me response not successful')
          tokenManager.remove()
          setUser(null)
        }
      }
    } catch (error) {
      console.error('❌ checkAuth error:', error)
      tokenManager.remove()
      setUser(null)
    } finally {
      setLoading(false)
      console.log('✅ Auth check complete')
    }
  }

  const login = async (email: string, password: string, mfaToken?: string) => {
    const response = await authAPI.login(email, password, mfaToken)

    if (response.success && response.data?.mfaRequired) {
      return { mfaRequired: true }
    }

    if (response.success && response.data) {
      // Save token first
      tokenManager.set(response.data.accessToken)

      // Set user in state
      setUser(response.data.user)

      window.location.href = '/'
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      tokenManager.remove()
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
