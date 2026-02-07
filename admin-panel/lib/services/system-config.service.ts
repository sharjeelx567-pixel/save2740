import { api } from '../api'

export interface SystemConfig {
  _id: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  category: 'auth' | 'kyc' | 'wallet' | 'payments' | 'save2740' | 'notifications' | 'general'
  description: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export const systemConfigService = {
  // Get all system configurations
  getConfigs: async (category?: string) => {
    const query = category && category !== 'all' ? `?category=${category}` : ''
    return api.get<{ success: boolean; data: SystemConfig[] }>(
      `/api/admin/system-config${query}`
    )
  },

  // Get specific config by key
  getConfig: async (key: string) => {
    return api.get<{ success: boolean; data: SystemConfig }>(
      `/api/admin/system-config/${key}`
    )
  },

  // Create new config
  createConfig: async (data: {
    key: string
    value: any
    type: string
    category: string
    description: string
  }) => {
    return api.post<{ success: boolean; message: string; data: SystemConfig }>(
      '/api/admin/system-config',
      data
    )
  },

  // Update config
  updateConfig: async (key: string, data: { value?: any; description?: string }) => {
    return api.put<{ success: boolean; message: string; data: SystemConfig }>(
      `/api/admin/system-config/${key}`,
      data
    )
  },

  // Delete config
  deleteConfig: async (key: string) => {
    return api.delete<{ success: boolean; message: string }>(
      `/api/admin/system-config/${key}`
    )
  },

  // Get all categories
  getCategories: async () => {
    return api.get<{ success: boolean; data: string[] }>(
      '/api/admin/system-config/categories/list'
    )
  },
}
