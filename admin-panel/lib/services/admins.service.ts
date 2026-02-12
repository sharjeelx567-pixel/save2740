
import { api } from '../api'

export interface AdminUser {
    _id: string;
    username: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN';
    isActive: boolean;
    permissions: string[];
    createdAt: string;
    lastLogin?: string;
}

export const adminsService = {
    getAdmins: async () => {
        return api.get<{ success: boolean; data: AdminUser[] }>('/api/admin/administrators');
    },

    createAdmin: async (data: { username: string; email: string; password?: string; role: string; permissions?: string[] }) => {
        return api.post('/api/admin/administrators', data);
    },

    updateAdmin: async (id: string, data: { role?: string; permissions?: string[]; isActive?: boolean }) => {
        return api.put(`/api/admin/administrators/${id}`, data);
    }
}
