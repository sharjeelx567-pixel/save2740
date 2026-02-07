/**
 * Optimized Notifications Hook
 * Centralized notification management with React Query caching
 * Replaces polling in DashboardHeader with efficient caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/constants';

interface Notification {
    _id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type?: string;
}

interface NotificationsResponse {
    success: boolean;
    data: {
        notifications?: Notification[];
        items?: Notification[];
    };
}

export function useNotifications() {
    const queryClient = useQueryClient();

    // Fetch notifications with longer staleTime to reduce requests
    const { data, isLoading, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: async (): Promise<Notification[]> => {
            const token = localStorage.getItem('token');
            if (!token) return [];

            const response = await fetch(`${API.BASE_URL}/api/notifications`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const result: NotificationsResponse = await response.json();
            return result.data.notifications || result.data.items || [];
        },
        staleTime: 30 * 1000, // 30 seconds - reduced from 5 second polling
        refetchInterval: 60 * 1000, // 1 minute instead of 5 seconds
        refetchOnWindowFocus: true,
        refetchOnMount: false, // Don't refetch on every component mount
        retry: 1,
    });

    // Mark all as read mutation
    const markAllAsRead = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API.BASE_URL}/api/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to mark notifications as read');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch notifications
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const notifications = data || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        markAllAsRead: markAllAsRead.mutate,
        refetch: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    };
}
