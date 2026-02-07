const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Token management
export const tokenManager = {
  get: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token')
    }
    return null
  },
  set: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token)
      // Set cookie for middleware access
      document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Strict`
    }
  },
  remove: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      // Remove cookie
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    }
  }
}

// API Error class
export class APIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
    this.name = 'APIError'
  }
}

// Request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenManager.get()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store', // CRITICAL: Prevent 304 responses
      credentials: 'include',
    })

    // Handle 401 - redirect to login
    if (response.status === 401) {
      tokenManager.remove()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new APIError(401, 'Unauthorized')
    }

    // Parse response
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new APIError(
        response.status,
        data.message || data.error || 'Request failed',
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(500, 'Network error')
  }
}

// API methods
export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
}

// Admin Auth API - Calls Backend API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { accessToken: string; user: any } }>('/api/admin/auth/login', {
      email,
      password,
    }),

  me: () => api.get<{ success: boolean; data: any }>('/api/admin/auth/me'),
}
