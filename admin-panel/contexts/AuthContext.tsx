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
  login: (email: string, password: string) => Promise<void>
  logout: () => void
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
      const token = tokenManager.get()
      
      if (!token) {
        console.log('❌ No token found')
        setLoading(false)
        return
      }

      console.log('✅ Token found, calling /api/admin/auth/me')
      const response = await authAPI.me()
      console.log('📥 /me response:', response)
      
      if (response.success && response.data) {
        console.log('✅ Setting user:', response.data)
        setUser(response.data)
        
        // Don't initialize FCM on checkAuth - it's causing issues
        // Will only init on explicit login
      } else {
        console.log('❌ /me response not successful')
        tokenManager.remove()
      }
    } catch (error) {
      console.error('❌ checkAuth error:', error)
      tokenManager.remove()
    } finally {
      setLoading(false)
      console.log('✅ Auth check complete')
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password)
    if (response.success && response.data) {
      // Save token first
      tokenManager.set(response.data.accessToken)
      
      // Set user in state
      setUser(response.data.user)
      
      console.log('✅ Login successful! User:', response.data.user)
      console.log('🔄 Redirecting to dashboard with window.location...')
      
      // Skip FCM initialization - it's causing redirect issues
      // Can be enabled later when properly configured
      
      // Use window.location.href for reliable redirect
      window.location.href = '/'
    }
  }

  const logout = () => {
    tokenManager.remove()
    setUser(null)
    router.push('/login')
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
