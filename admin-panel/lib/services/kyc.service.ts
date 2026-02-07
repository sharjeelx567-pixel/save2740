import { api } from '../api'
import { KYCRequest } from '@/types'

export const kycService = {
  // Get all pending KYC requests
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
