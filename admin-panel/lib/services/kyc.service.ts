import { api } from '../api'
import { KYCRequest } from '@/types'

export const kycService = {
  // Get KYC list with server-side filters
  getKYCList: async (params: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams()
    if (params.status && params.status !== 'all') query.append('status', params.status)
    if (params.search) query.append('search', params.search)
    if (params.page) query.append('page', params.page.toString())
    if (params.limit) query.append('limit', params.limit.toString())
    const response = await api.get<{ success: boolean; data: any[]; pagination?: any }>(`/api/admin/kyc/list?${query.toString()}`)
    return { data: response.data, pagination: response.pagination }
  },

  // Get all pending KYC requests (legacy)
  getPendingKYC: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/api/admin/kyc/pending`)
    return response.data
  },

  // Get KYC details for a specific user
  getKYCByUserId: async (userId: string) => {
    const response = await api.get<{ success: boolean; data: any }>(`/api/admin/kyc/${userId}`)
    return response.data
  },

  // Approve KYC
  approveKYC: async (userId: string, kycId: string, notes?: string) => {
    return api.post(`/api/admin/kyc/approve`, { userId, kycId, notes })
  },

  // Reject KYC
  rejectKYC: async (userId: string, kycId: string, reason: string, notes?: string) => {
    return api.post(`/api/admin/kyc/reject`, { userId, kycId, reason, notes })
  },

  // Request re-upload
  requestReupload: async (userId: string, kycId: string, reason: string, notes?: string) => {
    return api.post(`/api/admin/kyc/request-reupload`, { userId, kycId, reason, notes })
  },

  // Get audit log for KYC document
  getAuditLog: async (kycId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/api/admin/kyc/audit-log/${kycId}`)
    return response.data
  },
}
