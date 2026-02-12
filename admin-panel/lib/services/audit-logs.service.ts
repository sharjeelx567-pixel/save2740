import { api } from '../api';

export const auditLogsService = {
  getLogs: async (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/admin/audit-logs?${query}`);
  },

  getUserLogs: async (userId: string) => {
    return api.get(`/api/admin/audit-logs?resourceId=${userId}&resourceType=user`);
  },

  getGroupLogs: async (groupId: string) => {
    return api.get(`/api/admin/audit-logs?resourceId=${groupId}&resourceType=group`);
  }
};
