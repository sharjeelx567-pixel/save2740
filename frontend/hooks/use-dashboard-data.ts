/**
 * Optimized Dashboard Data Hook
 * Fetches all dashboard data in parallel with React Query caching
 * Reduces sequential API calls and improves initial load time
 */

import { useQuery } from '@tanstack/react-query';
import { API } from '@/lib/constants';

interface DashboardStats {
    totalSavings: number;
    currentStreak: number;
    goalsAchieved: number;
    daysActive: number;
}

interface DashboardBreakdown {
    totalContributed: number;
    interestEarned: number;
    bonuses: number;
    penalties: number;
}

interface DashboardContribution {
    hasContributedToday: boolean;
    amount: number;
    timestamp?: string;
}

interface DashboardData {
    stats: DashboardStats | null;
    breakdown: DashboardBreakdown | null;
    contribution: DashboardContribution | null;
    streak: any | null;
    achievements: any[] | null;
}

async function fetchDashboardEndpoint(endpoint: string, token: string) {
    const response = await fetch(`${API.BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}`);
    }

    const data = await response.json();
    return data.data;
}

export function useDashboardData() {
    return useQuery({
        queryKey: ['dashboard', 'overview'],
        queryFn: async (): Promise<DashboardData> => {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token');
            }

            // Parallelize all dashboard API calls
            const [stats, breakdown, contribution, streak, achievements] = await Promise.all([
                fetchDashboardEndpoint(API.ENDPOINTS.DASHBOARD_STATS, token).catch(() => null),
                fetchDashboardEndpoint(API.ENDPOINTS.DASHBOARD_BREAKDOWN, token).catch(() => null),
                fetchDashboardEndpoint(API.ENDPOINTS.DASHBOARD_CONTRIBUTION, token).catch(() => null),
                fetchDashboardEndpoint(API.ENDPOINTS.DASHBOARD_STREAK, token).catch(() => null),
                fetchDashboardEndpoint(API.ENDPOINTS.DASHBOARD_ACHIEVEMENTS, token).catch(() => []),
            ]);

            return {
                stats,
                breakdown,
                contribution,
                streak,
                achievements,
            };
        },
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
        retry: 1,
    });
}
