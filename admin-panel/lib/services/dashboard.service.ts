import { api } from '../api'

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  pendingKYC: number
  totalWalletBalance: number
  dailyTransactions: number
  failedPayments: number
  activePlans: number
  totalRevenue: number
  charts?: {
    transactionVolume: { date: string; amount: number }[]
    userGrowth: { date: string; count: number }[]
  }
}

export interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  user?: string
  status?: 'success' | 'warning' | 'danger'
}

export interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<{ success: boolean; data: DashboardStats }>('/api/admin/dashboard/stats')
    return response.data
  },

  getRecentActivity: async (): Promise<Activity[]> => {
    const response = await api.get<{ success: boolean; data: Activity[] }>('/api/admin/dashboard/activity')
    return response.data
  },

  getSystemAlerts: async (): Promise<SystemAlert[]> => {
    const response = await api.get<{ success: boolean; data: SystemAlert[] }>('/api/admin/dashboard/alerts')
    return response.data
  },
}
