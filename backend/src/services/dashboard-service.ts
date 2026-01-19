/**
 * Dashboard Service
 * Business logic for dashboard statistics, calculations, and aggregations
 */

import { Save2740Plan } from '../models/save2740.model';
import { Transaction } from '../models/transaction';
import { DailyContribution } from '../models/DailyContribution';
import { Achievement } from '../models/Achievement';

export class DashboardService {
    /**
     * Calculate comprehensive dashboard statistics
     */
    static async getDashboardStats(userId: string) {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);

        // Get all active plans
        const activePlans = await Save2740Plan.find({ userId, status: 'active' });

        // Get completed contributions this year
        const contributions = await DailyContribution.find({
            userId,
            status: 'completed',
            date: { $gte: yearStart },
        }).sort({ date: -1 });

        // Calculate totals
        const totalSaved = activePlans.reduce((sum, plan) => sum + plan.currentBalance, 0);
        const totalTarget = activePlans.reduce((sum, plan) => sum + plan.totalTargetAmount, 0);
        const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);

        // Calculate daily average
        const daysInYear = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        const avgDailySavings = daysInYear > 0 ? totalContributions / daysInYear : 0;

        // Calculate next milestone
        const milestones = [500, 1000, 2500, 5000, 7500, 10000, 27400];
        const totalSavedDollars = totalSaved / 100;
        const nextMilestone = milestones.find(m => m > totalSavedDollars) || 27400;
        const remaining = Math.max(0, (nextMilestone * 100) - totalSaved);

        // Calculate projected yearly total
        const dailyRate = 2740; // $27.40 in cents
        const daysRemaining = 365 - daysInYear;
        const projectedYearlyTotal = totalContributions + (dailyRate * daysRemaining);

        return {
            currentBalance: totalSaved,
            projectedYearlyTotal,
            yearlyGoal: 2740000, // $27,400 in cents
            daysActive: contributions.length,
            avgDailySavings,
            activePlansCount: activePlans.length,
            totalContributions,
            nextMilestone: {
                amount: nextMilestone * 100,
                remaining,
            },
        };
    }

    /**
     * Calculate savings breakdown by different categories
     */
    static async getSavingsBreakdown(userId: string) {
        const plans = await Save2740Plan.find({ userId, status: { $in: ['active', 'completed'] } });

        // Breakdown by plan
        const byPlan = plans.map(plan => ({
            planId: plan._id.toString(),
            planName: plan.name,
            amount: plan.currentBalance,
            percentage: 0, // Will calculate after
        }));

        const totalSaved = byPlan.reduce((sum, p) => sum + p.amount, 0);
        byPlan.forEach(p => {
            p.percentage = totalSaved > 0 ? (p.amount / totalSaved) * 100 : 0;
        });

        // Breakdown by month (current year)
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const contributions = await DailyContribution.find({
            userId,
            status: 'completed',
            date: { $gte: yearStart },
        });

        const byMonth: Array<{ month: string; amount: number }> = [];
        for (let m = 0; m < now.getMonth() + 1; m++) {
            const monthStart = new Date(now.getFullYear(), m, 1);
            const monthEnd = new Date(now.getFullYear(), m + 1, 0);

            const monthContributions = contributions.filter(c => {
                const cDate = new Date(c.date);
                return cDate >= monthStart && cDate <= monthEnd;
            });

            const monthAmount = monthContributions.reduce((sum, c) => sum + c.amount, 0);
            byMonth.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                amount: monthAmount,
            });
        }

        // Breakdown by mode
        const dailyPlans = plans.filter(p => p.savingsMode === 'daily');
        const weeklyPlans = plans.filter(p => p.savingsMode === 'weekly');

        const byMode = {
            daily: dailyPlans.reduce((sum, p) => sum + p.currentBalance, 0),
            weekly: weeklyPlans.reduce((sum, p) => sum + p.currentBalance, 0),
        };

        return {
            byPlan,
            byMonth,
            byMode,
        };
    }

    /**
     * Calculate streak information
     */
    static async getStreakInfo(userId: string) {
        const contributions = await DailyContribution.find({
            userId,
            status: 'completed',
        }).sort({ date: -1 });

        if (contributions.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                streakHistory: [],
                missedDaysThisMonth: 0,
                consistencyPercentage: 0,
            };
        }

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let checkDate = new Date(today);
        const contributionDates = new Set(
            contributions.map(c => new Date(c.date).toISOString().split('T')[0])
        );

        while (contributionDates.has(checkDate.toISOString().split('T')[0])) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate: Date | null = null;

        for (const contrib of contributions) {
            const contribDate = new Date(contrib.date);
            if (prevDate) {
                const diffDays = Math.round((prevDate.getTime() - contribDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }
            prevDate = contribDate;
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Get streak history (last 30 days)
        const streakHistory: Array<{ date: string; contributed: boolean }> = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            streakHistory.push({
                date: dateStr,
                contributed: contributionDates.has(dateStr),
            });
        }

        // Calculate missed days this month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysInMonth = today.getDate();
        const contributionsThisMonth = contributions.filter(c => {
            const cDate = new Date(c.date);
            return cDate >= monthStart && cDate <= today;
        }).length;
        const missedDaysThisMonth = daysInMonth - contributionsThisMonth;

        // Calculate consistency percentage
        const consistencyPercentage = daysInMonth > 0 ? (contributionsThisMonth / daysInMonth) * 100 : 0;

        return {
            currentStreak,
            longestStreak,
            streakHistory,
            missedDaysThisMonth,
            consistencyPercentage,
        };
    }

    /**
     * Check today's contribution status
     */
    static async getTodayContribution(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const contribution = await DailyContribution.findOne({
            userId,
            date: { $gte: today },
        });

        return {
            contributed: contribution?.status === 'completed',
            amount: contribution?.amount || 0,
            status: contribution?.status || 'pending',
            contributionId: contribution?._id?.toString(),
        };
    }

    /**
     * Get achievements data
     */
    static async getAchievements(userId: string) {
        const unlocked = await Achievement.find({ userId }).sort({ unlockedAt: -1 });

        // Define all possible achievements
        const savingsMilestones = [500, 1000, 2500, 5000, 7500, 10000, 27400];
        const streakMilestones = [7, 30, 60, 90, 180, 365];

        // Get current progress
        const stats = await this.getDashboardStats(userId);
        const streak = await this.getStreakInfo(userId);

        // Calculate locked savings achievements
        const totalSavedDollars = stats.currentBalance / 100;
        const lockedSavings = savingsMilestones
            .filter(m => m > totalSavedDollars)
            .map(m => ({
                type: 'savings_milestone',
                target: m * 100,
                current: stats.currentBalance,
                remaining: (m * 100) - stats.currentBalance,
            }));

        // Calculate locked streak achievements
        const lockedStreaks = streakMilestones
            .filter(s => s > streak.longestStreak)
            .map(s => ({
                type: 'streak_milestone',
                target: s,
                current: streak.longestStreak,
                remaining: s - streak.longestStreak,
            }));

        const locked = [...lockedSavings, ...lockedStreaks];

        return {
            unlocked,
            locked,
            totalUnlocked: unlocked.length,
            totalAvailable: savingsMilestones.length + streakMilestones.length + 2, // +2 for first_contribution and plan_completed
        };
    }
}
