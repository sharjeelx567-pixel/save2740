import { api } from '../api';

export const groupsService = {
    getGroups: async (params: any = {}) => {
        // Filter out undefined/null values to prevent 'undefined' strings in URL
        const cleanParams = Object.entries(params).reduce((acc: any, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});
        const query = new URLSearchParams(cleanParams).toString();
        return api.get(`/api/admin/groups?${query}`);
    },

    getGroupById: async (id: string) => {
        return api.get(`/api/admin/groups/${id}`);
    },

    freezeGroup: async (id: string, reason: string) => {
        return api.post(`/api/admin/groups/${id}/freeze`, { reason });
    },

    unfreezeGroup: async (id: string, reason: string, targetStatus: string = 'active') => {
        return api.post(`/api/admin/groups/${id}/unfreeze`, { reason, targetStatus });
    },

    removeMember: async (groupId: string, userId: string, reason: string) => {
        return api.delete(`/api/admin/groups/${groupId}/member/${userId}`, { reason });
    },

    reinstateMember: async (groupId: string, userId: string) => {
        return api.post(`/api/admin/groups/${groupId}/member/${userId}/reinstate`);
    },

    triggerPayout: async (groupId: string, force: boolean = false) => {
        return api.post(`/api/admin/groups/${groupId}/payout`, { force });
    }
};
