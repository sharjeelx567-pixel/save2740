import { api } from '../api'
import { User } from '@/types'

export interface UsersListResponse {
  success: boolean
  data: {
    users: User[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export const usersService = {
  getUsers: async (params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    kycStatus?: string
    financialRole?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<UsersListResponse> => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.limit) query.append('limit', params.limit.toString())
    if (params.search) query.append('search', params.search)
    if (params.status && params.status !== 'all') query.append('status', params.status)
    if (params.kycStatus && params.kycStatus !== 'all') query.append('kycStatus', params.kycStatus)
    if (params.financialRole && params.financialRole !== 'all') query.append('financialRole', params.financialRole)
    if (params.dateFrom) query.append('dateFrom', params.dateFrom)
    if (params.dateTo) query.append('dateTo', params.dateTo)

    return api.get<UsersListResponse>(`/api/admin/users?${query.toString()}`)
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get<{ success: boolean; data: any }>(`/api/admin/users/${id}`)
    return response.data
  },

  getUserStats: async () => {
    const response = await api.get<{ success: boolean; data: any }>(`/api/admin/users/stats/overview`)
    return response.data
  },

  lockUser: async (userId: string, reason?: string) => {
    return api.post(`/api/admin/users/lock`, { userId, reason })
  },

  unlockUser: async (userId: string) => {
    return api.post(`/api/admin/users/unlock`, { userId })
  },

  suspendUser: async (userId: string, reason?: string) => {
    return api.post(`/api/admin/users/suspend`, { userId, reason })
  },

  forceLogout: async (userId: string) => {
    return api.post(`/api/admin/users/force-logout`, { userId })
  },

  getUserById: async (id: string) => {
    return api.get<{ success: boolean; data: any }>(`/api/admin/users/${id}`)
  },

  addNote: async (userId: string, note: string) => {
    return api.post(`/api/admin/users/${userId}/note`, { note })
  },

  freezeWallet: async (userId: string, reason: string) => {
    return api.post(`/api/admin/users/${userId}/wallet/freeze`, { reason })
  },

  unfreezeWallet: async (userId: string, reason: string) => {
    return api.post(`/api/admin/users/${userId}/wallet/unfreeze`, { reason })
  },
}
