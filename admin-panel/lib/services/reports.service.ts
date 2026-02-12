import { api } from '../api';
import { tokenManager } from '../api';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const reportsService = {
    getSummary: async () => {
        return api.get('/api/admin/reports/summary');
    },

    getRevenue: async (timeframe: string = '30d') => {
        return api.get(`/api/admin/reports/revenue?timeframe=${timeframe}`);
    },

    getHealth: async () => {
        return api.get('/api/admin/reports/health');
    },

    /** Download transactions CSV (uses fetch + blob for file download) */
    downloadTransactionsCsv: async (timeframe: string = '30d') => {
        const token = tokenManager.get();
        if (!token) throw new Error('Not authenticated');
        let url = `${getBaseUrl()}/api/admin/reports/export/transactions`;
        if (timeframe !== 'all') {
            const days = timeframe === '90d' ? 90 : timeframe === '7d' ? 7 : 30;
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - days);
            url += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
        }
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition');
        const filename = disposition?.match(/filename=(.+)/)?.[1]?.replace(/"/g, '') || `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    },
};
