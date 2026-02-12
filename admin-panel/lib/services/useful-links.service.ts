import { api } from '../api'

export interface UsefulLinkItem {
  _id: string
  title: string
  slug: string
  content: string
  enabled: boolean
  status: 'draft' | 'published' | 'archived'
  displayOrder: number
  effectiveDate?: string
  lastEditedBy?: string
  lastEditedAt?: string
  versions: { title: string; slug: string; content: string; updatedBy: string; updatedAt: string }[]
  createdAt: string
  updatedAt: string
}

export const usefulLinksService = {
  list: async (): Promise<UsefulLinkItem[]> => {
    const res = await api.get<{ success: boolean; data: UsefulLinkItem[] }>('/api/admin/useful-links')
    return res.data || []
  },

  getById: async (id: string): Promise<UsefulLinkItem> => {
    const res = await api.get<{ success: boolean; data: UsefulLinkItem }>(`/api/admin/useful-links/${id}`)
    return res.data
  },

  create: async (body: Partial<UsefulLinkItem>) => {
    const res = await api.post<{ success: boolean; data: UsefulLinkItem }>('/api/admin/useful-links', body)
    return res.data
  },

  update: async (id: string, body: Partial<UsefulLinkItem>) => {
    const res = await api.put<{ success: boolean; data: UsefulLinkItem }>(`/api/admin/useful-links/${id}`, body)
    return res.data
  },

  patch: async (id: string, body: { displayOrder?: number; enabled?: boolean; status?: string }) => {
    const res = await api.patch<{ success: boolean; data: UsefulLinkItem }>(`/api/admin/useful-links/${id}`, body)
    return res.data
  },

  rollback: async (id: string, versionIndex: number) => {
    const res = await api.post<{ success: boolean; data: UsefulLinkItem }>(`/api/admin/useful-links/${id}/rollback`, { versionIndex })
    return res.data
  },
}
