import { api } from '../api'

export interface AuditLog {
  _id: string
  userId?: string
  action: string
  resourceType: 'user' | 'wallet' | 'transaction' | 'pocket' | 'kyc' | 'referral' | 'payment' | 'system'
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  metadata?: Record<string, any>
  severity: 'info' | 'warning' | 'error' | 'critical'
  createdAt: string
  user?: {
    email: string
    firstName: string
    lastName: string
  }
}

export const auditLogsService = {
  // Get all audit logs
  getLogs: async (params?: {
    page?: number
    limit?: number
    resourceType?: string
    severity?: string
    userId?: string
    action?: string
    startDate?: string
    endDate?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.resourceType && params.resourceType !== 'all') query.append('resourceType', params.resourceType)
    if (params?.severity && params.severity !== 'all') query.append('severity', params.severity)
    if (params?.userId) query.append('userId', params.userId)
    if (params?.action) query.append('action', params.action)
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)

    return api.get<{
      success: boolean
      data: {
        logs: AuditLog[]
        pagination: { page: number; limit: number; total: number; pages: number }
      }
    }>(`/api/admin/audit-logs?${query.toString()}`)
  },

  // Get audit log statistics
  getStats: async () => {
    return api.get<{
      success: boolean
      data: {
        totalLogs: number
        recentLogs: number
        criticalLogs: number
        errorLogs: number
        logsByType: Record<string, number>
      }
    }>('/api/admin/audit-logs/stats')
  },

  // Get specific audit log
  getLog: async (logId: string) => {
    return api.get<{
      success: boolean
      data: {
        log: AuditLog
        user: any
      }
    }>(`/api/admin/audit-logs/${logId}`)
  },

  // Get logs for specific user
  getUserLogs: async (userId: string, page = 1, limit = 20) => {
    return api.get<{
      success: boolean
      data: {
        logs: AuditLog[]
        pagination: { page: number; limit: number; total: number; pages: number }
      }
    }>(`/api/admin/audit-logs/user/${userId}?page=${page}&limit=${limit}`)
  },
}
