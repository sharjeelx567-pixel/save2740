/**
 * Admin Panel Auth Utilities - CLIENT SIDE ONLY
 * No database access - all auth is handled by backend API
 */

export interface AdminPayload {
  userId: string
  email: string
  role: string
}

/**
 * Decode JWT token (CLIENT-SIDE ONLY - NO VERIFICATION)
 * Token verification is done by the backend
 */
export function decodeToken(token: string): AdminPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload) as AdminPayload
  } catch (error) {
    return null
  }
}

/**
 * Check if token is expired (CLIENT-SIDE CHECK ONLY)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token)
    if (!decoded || !(decoded as any).exp) return true
    
    return (decoded as any).exp * 1000 < Date.now()
  } catch {
    return true
  }
}
