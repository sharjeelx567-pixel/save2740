/**
 * Save2740 Service
 * Core logic for $27.40/day challenge calculations and projections
 */

import { Save2740Plan } from '@/lib/models/save2740.model';
import { DailyContribution } from '@/lib/models/DailyContribution';
import { connectDB } from '@/lib/db';

export const DAILY_CHALLENGE_AMOUNT = 27.4; // $27.40/day
export const YEARLY_TARGET = 10000; // ~$10,000/year

export interface Save2740Projection {
  currentBalance: number;
  targetAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  daysElapsed: number;
  daysRemaining: number;
  averageDailyContribution: number;
  projectedCompletionDate: Date | null;
  weeklyProjection: number;
  monthlyProjection: number;
  onTrack: boolean;
  streakDays: number;
  longestStreak: number;
}

/**
 * Calculate Save2740 plan projections
 */
export async function calculateProjections(planId: string): Promise<Save2740Projection> {
  await connectDB();

  const plan = await Save2740Plan.findById(planId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  const now = new Date();
  const startDate = new Date(plan.startDate);
  const targetDate = new Date(plan.targetCompletionDate);

  // Calculate days
  const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Get daily contributions
  const contributions = await DailyContribution.find({
    planId: plan._id.toString(),
    status: 'completed',
  }).sort({ date: 1 });

  // Calculate average daily contribution
  const averageDailyContribution =
    contributions.length > 0
      ? contributions.reduce((sum, c) => sum + c.amount / 100, 0) / contributions.length
      : 0;

  // Calculate projections
  const remainingAmount = plan.totalTargetAmount - plan.currentBalance;
  const progressPercentage = (plan.currentBalance / plan.totalTargetAmount) * 100;

  // Projected completion date based on current average
  let projectedCompletionDate: Date | null = null;
  if (averageDailyContribution > 0 && remainingAmount > 0) {
    const daysNeeded = Math.ceil(remainingAmount / averageDailyContribution);
    projectedCompletionDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
  }

  // Weekly and monthly projections
  const weeklyProjection = averageDailyContribution * 7;
  const monthlyProjection = averageDailyContribution * 30;

  // Check if on track (should save at least $27.40/day on average)
  const expectedBalance = daysElapsed * DAILY_CHALLENGE_AMOUNT;
  const onTrack = plan.currentBalance >= expectedBalance * 0.9; // 90% threshold

  return {
    currentBalance: plan.currentBalance,
    targetAmount: plan.totalTargetAmount,
    remainingAmount,
    progressPercentage: Math.min(100, progressPercentage),
    daysElapsed,
    daysRemaining,
    averageDailyContribution,
    projectedCompletionDate,
    weeklyProjection,
    monthlyProjection,
    onTrack,
    streakDays: plan.streakDays,
    longestStreak: plan.longestStreak,
  };
}

/**
 * Record daily contribution ($27.40/day)
 */
export async function recordDailyContribution(
  userId: string,
  planId: string,
  amount: number = DAILY_CHALLENGE_AMOUNT,
  paymentMethodId?: string
) {
  await connectDB();

  const plan = await Save2740Plan.findOne({ _id: planId, userId });
  if (!plan) {
    throw new Error('Plan not found');
  }

  if (plan.status !== 'active') {
    throw new Error('Plan is not active');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already contributed today
  const existingContribution = await DailyContribution.findOne({
    userId,
    planId,
    date: today,
  });

  if (existingContribution && existingContribution.status === 'completed') {
    throw new Error('Already contributed today');
  }

  // Create or update daily contribution
  const contribution = existingContribution
    ? await DailyContribution.findByIdAndUpdate(
        existingContribution._id,
        {
          amount: Math.round(amount * 100), // Store in cents
          status: 'completed',
          completedAt: new Date(),
          paymentMethodId,
        },
        { new: true }
      )
    : await DailyContribution.create({
        userId,
        planId,
        date: today,
        amount: Math.round(amount * 100),
        status: 'completed',
        completedAt: new Date(),
        paymentMethodId,
      });

  // Update plan
  plan.currentBalance += amount;
  plan.totalContributions += amount;
  plan.contributionCount += 1;
  plan.lastContributionDate = today;
  plan.daysActive += 1;

  // Update streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayContribution = await DailyContribution.findOne({
    userId,
    planId,
    date: yesterday,
    status: 'completed',
  });

  if (yesterdayContribution) {
    plan.streakDays += 1;
    plan.longestStreak = Math.max(plan.longestStreak, plan.streakDays);
  } else {
    plan.streakDays = 1; // Reset streak
  }

  // Check if plan is completed
  if (plan.currentBalance >= plan.totalTargetAmount) {
    plan.status = 'completed';
    plan.completionDate = new Date();
  }

  await plan.save();

  return {
    contribution,
    plan,
    streakDays: plan.streakDays,
    isCompleted: plan.status === 'completed',
  };
}

/**
 * Get user's Save2740 statistics
 */
export async function getUserSave2740Stats(userId: string) {
  await connectDB();

  const plans = await Save2740Plan.find({ userId });
  const activePlans = plans.filter((p) => p.status === 'active');
  const completedPlans = plans.filter((p) => p.status === 'completed');

  const totalSaved = plans.reduce((sum, p) => sum + p.currentBalance, 0);
  const totalTarget = plans.reduce((sum, p) => sum + p.totalTargetAmount, 0);
  const totalContributions = plans.reduce((sum, p) => sum + p.contributionCount, 0);

  // Get longest streak across all plans
  const longestStreak = Math.max(...plans.map((p) => p.longestStreak), 0);

  // Get current streak (from most recent contribution)
  const currentStreak = Math.max(...activePlans.map((p) => p.streakDays), 0);

  return {
    totalPlans: plans.length,
    activePlans: activePlans.length,
    completedPlans: completedPlans.length,
    totalSaved,
    totalTarget,
    progressPercentage: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    totalContributions,
    longestStreak,
    currentStreak,
    averageDailyAmount: totalContributions > 0 ? totalSaved / totalContributions : 0,
  };
}
