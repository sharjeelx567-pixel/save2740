import { api } from '../api'

export interface SupportTicket {
  _id: string
  ticketNumber: string
  userId: string
  subject: string
  category: 'account' | 'payment' | 'kyc' | 'technical' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'waiting-user' | 'resolved' | 'closed'
  messages: {
    senderId: string
    senderType: 'user' | 'admin'
    message: string
    attachments?: string[]
    timestamp: Date
  }[]
  assignedTo?: string
  resolvedAt?: Date
  resolvedBy?: string
  resolutionNotes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  user?: {
    email: string
    firstName: string
    lastName: string
  }
  assignedAdmin?: {
    email: string
    firstName: string
    lastName: string
  }
}

export const supportTicketsService = {
  // Get all support tickets
  getTickets: async (params?: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    category?: string
    assignedTo?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status && params.status !== 'all') query.append('status', params.status)
    if (params?.priority && params.priority !== 'all') query.append('priority', params.priority)
    if (params?.category && params.category !== 'all') query.append('category', params.category)
    if (params?.assignedTo && params.assignedTo !== 'all') query.append('assignedTo', params.assignedTo)

    return api.get<{
      success: boolean
      data: {
        tickets: SupportTicket[]
        pagination: { page: number; limit: number; total: number; pages: number }
      }
    }>(`/api/admin/support-tickets?${query.toString()}`)
  },

  // Get ticket statistics
  getStats: async () => {
    return api.get<{
      success: boolean
      data: {
        open: number
        inProgress: number
        resolved: number
        urgent: number
        total: number
      }
    }>('/api/admin/support-tickets/stats')
  },

  // Get ticket details
  getTicket: async (ticketId: string) => {
    return api.get<{
      success: boolean
      data: {
        ticket: SupportTicket
        user: any
        assignedAdmin: any
      }
    }>(`/api/admin/support-tickets/${ticketId}`)
  },

  // Reply to ticket
  replyToTicket: async (ticketId: string, message: string) => {
    return api.post<{ success: boolean; message: string; data: SupportTicket }>(
      `/api/admin/support-tickets/${ticketId}/reply`,
      { message }
    )
  },

  // Assign ticket
  assignTicket: async (ticketId: string, adminId?: string) => {
    return api.patch<{ success: boolean; message: string; data: SupportTicket }>(
      `/api/admin/support-tickets/${ticketId}/assign`,
      { adminId }
    )
  },

  // Update ticket status
  updateStatus: async (ticketId: string, status: string, resolutionNotes?: string) => {
    return api.patch<{ success: boolean; message: string; data: SupportTicket }>(
      `/api/admin/support-tickets/${ticketId}/status`,
      { status, resolutionNotes }
    )
  },

  // Update ticket priority
  updatePriority: async (ticketId: string, priority: string) => {
    return api.patch<{ success: boolean; message: string; data: SupportTicket }>(
      `/api/admin/support-tickets/${ticketId}/priority`,
      { priority }
    )
  },
}
