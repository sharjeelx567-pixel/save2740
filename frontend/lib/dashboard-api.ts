/**
 * Dashboard API client service
 * Handles all dashboard-related API calls
 */

import { apiClient } from "@/lib/api-client";
import { API } from "@/lib/constants";

export interface DashboardStats {
    currentBalance: number;
    projectedYearlyTotal: number;
    yearlyGoal: number;
    daysActive: number;
    avgDailySavings: number;
    activePlansCount: number;
    totalContributions: number;
    nextMilestone: {
        amount: number;
        remaining: number;
    };
}

export interface StreakInfo {
    currentStreak: number;
    longestStreak: number;
    streakHistory: Array<{ date: string; contributed: boolean }>;
    missedDaysThisMonth: number;
    consistencyPercentage: number;
}

export interface ContributionStatus {
    contributed: boolean;
    amount: number;
    status: string;
    contributionId?: string;
}

export interface DashboardOverview {
    stats: DashboardStats;
    streak: StreakInfo;
    todayContribution: ContributionStatus;
    achievements: {
        unlocked: number;
        total: number;
    };
    activePlans: any[];
    recentTransactions: any[];
}

export class DashboardAPI {
    /**
     * Fetch complete dashboard overview
     */
    static async getOverview() {
        return apiClient.get<DashboardOverview>(API.ENDPOINTS.DASHBOARD_OVERVIEW);
    }

    /**
     * Fetch dashboard statistics
     */
    static async getStats() {
        return apiClient.get<DashboardStats>(API.ENDPOINTS.DASHBOARD_STATS);
    }

    /**
     * Fetch savings breakdown
     */
    static async getSavingsBreakdown() {
        return apiClient.get(API.ENDPOINTS.DASHBOARD_BREAKDOWN);
    }

    /**
     * Get today's contribution status
     */
    static async getTodayContribution() {
        return apiClient.get<ContributionStatus>(API.ENDPOINTS.DASHBOARD_CONTRIBUTION);
    }

    /**
     * Process manual contribution
     */
    static async processContribution(amount: number, paymentMethodId: string, planId?: string) {
        return apiClient.post(API.ENDPOINTS.DASHBOARD_CONTRIBUTION, {
            amount,
            paymentMethodId,
            planId,
        });
    }

    /**
     * Get streak information
     */
    static async getStreak() {
        return apiClient.get<StreakInfo>(API.ENDPOINTS.DASHBOARD_STREAK);
    }

    /**
     * Get achievements
     */
    static async getAchievements() {
        return apiClient.get(API.ENDPOINTS.DASHBOARD_ACHIEVEMENTS);
    }
}

