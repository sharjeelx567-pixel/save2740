import { api } from '../api'

export interface Notification {
    id: string
    _id?: string
    title: string
    message: string
    type: string
    userId: string
    read: boolean
    createdAt: string
    relatedData?: {
        chatUserId?: string
        chatUserName?: string
        submittedByUserId?: string
        submittedByName?: string
        submittedByEmail?: string
        userId?: string
        userName?: string
        amount?: number
        transactionId?: string
    }
    recipientName?: string
    recipientEmail?: string
}

export interface AdminFeedResponse {
    success: boolean
    data: {
        notifications: Notification[]
        unreadCount: number
        unseenChatCount: number
        pagination: { page: number; limit: number; total: number; pages: number }
    }
}

export const notificationsService = {
    /** Feed for current admin (KYC, payments, chat, etc.) */
    getFeed: async (params?: { page?: number; limit?: number }) => {
        const query = new URLSearchParams()
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())
        return api.get<AdminFeedResponse>(`/api/admin/notifications/feed?${query.toString()}`)
    },

    markAsRead: async (id: string) => {
        return api.put<{ success: boolean; data: Notification }>(`/api/admin/notifications/${id}/read`)
    },

    markAllRead: async () => {
        return api.post<{ success: boolean }>('/api/admin/notifications/mark-all-read')
    },

    getHistory: async (params?: { page?: number, limit?: number }) => {
        const query = new URLSearchParams()
        if (params?.page) query.append('page', params.page.toString())
        if (params?.limit) query.append('limit', params.limit.toString())

        return api.get<{
            success: boolean;
            data: {
                notifications: Notification[];
                pagination: { page: number; limit: number; total: number; pages: number }
            }
        }>(`/api/admin/notifications/history?${query.toString()}`)
    },

    send: async (data: {
        targetAudience: string;
        userId?: string;
        title: string;
        message: string;
        type?: string;
    }) => {
        return api.post<{ success: boolean; message: string; count: number }>('/api/admin/notifications/send', data)
    }
}
