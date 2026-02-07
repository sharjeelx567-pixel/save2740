import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  kycStatus: string;
  accountStatus: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const usersApi = {
  getAll: async (page = 1, limit = 50, search?: string, status?: string): Promise<UsersResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await api.get<{ success: boolean; data: UsersResponse }>(
      `/api/admin/users?${params.toString()}`
    );
    return response.data;
  },

  lock: async (userId: string): Promise<void> => {
    await api.post('/api/admin/users/lock', { userId });
  },

  unlock: async (userId: string): Promise<void> => {
    await api.post('/api/admin/users/unlock', { userId });
  },
};
