/**
 * Save2740 Core Flows Types
 * Product's identity - the core savings plan system
 */

/**
 * Savings Mode for the plan
 */
export type SavingsMode = 'daily' | 'weekly';

/**
 * Plan Status
 */
export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

/**
 * Savings Goal
 */
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // in cents
  description?: string;
  category: 'emergency' | 'vacation' | 'education' | 'home' | 'vehicle' | 'custom';
  emoji?: string;
}

/**
 * Save2740 Plan (Core Product)
 */
export interface Save2740Plan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: PlanStatus;
  savingsMode: SavingsMode;
  dailyAmount?: number; // Amount to save per day in cents
  weeklyAmount?: number; // Amount to save per week in cents
  totalTargetAmount: number; // Target savings goal in cents
  currentBalance: number; // Current amount saved in cents
  savingsGoal?: SavingsGoal; // Optional linked savings goal
  startDate: string;
  targetCompletionDate: string;
  estimatedCompletionDate?: string;
  completionDate?: string;
  pausedAt?: string;
  pausedBalance?: number;
  pauseReason?: string;
  totalContributions: number; // Total amount contributed in cents
  contributionCount: number; // Number of contributions made
  daysActive: number;
  streakDays: number; // Consecutive days without missing
  longestStreak: number;
  lastContributionDate?: string;
  nextContributionDate?: string;
  autoFund: boolean; // Whether auto-debit is enabled
  autoFundPaymentMethodId?: string; // Payment method for auto-debit
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
    milestoneAlerts: boolean;
  };
  visibility: 'private' | 'friends' | 'public';
  createdAt: string;
  updatedAt: string;
}

/**
 * Plan Summary (for confirmation screen)
 */
export interface PlanSummary {
  id: string;
  name: string;
  savingsMode: SavingsMode;
  dailyAmount?: number;
  weeklyAmount?: number;
  monthlyEquivalent: number; // Calculated monthly amount
  yearlyEquivalent: number; // Calculated yearly amount
  targetAmount: number;
  startDate: string;
  estimatedCompletionDate: string;
  savingsGoal?: SavingsGoal;
}

/**
 * Plan Milestone
 */
export interface PlanMilestone {
  id: string;
  planId: string;
  milestoneAmount: number; // Amount in cents at which milestone triggers
  percentComplete: number; // 0-100
  title: string;
  description: string;
  emoji: string;
  reachedAt?: string;
  reward?: {
    type: 'badge' | 'points' | 'bonus';
    value: number;
    description: string;
  };
}

/**
 * Plan Contribution (transaction)
 */
export interface PlanContribution {
  id: string;
  planId: string;
  userId: string;
  amount: number; // in cents
  source: 'manual' | 'auto-debit' | 'bonus' | 'referral' | 'challenge';
  timestamp: string;
  description?: string;
  relatedTransactionId?: string; // Link to wallet transaction
}

/**
 * Plan Completion Celebration Data
 */
export interface PlanCompletionData {
  planId: string;
  planName: string;
  totalSaved: number; // in cents
  targetAmount: number; // in cents
  daysToComplete: number;
  totalContributions: number;
  longestStreak: number;
  completionDate: string;
  nextPlanSuggestions?: {
    name: string;
    suggestedAmount: number;
    reason: string;
  }[];
  achievements: {
    badge: string;
    title: string;
    description: string;
  }[];
}

/**
 * Create Plan Request
 */
export interface CreatePlanRequest {
  name: string;
  description?: string;
  savingsMode: 'daily' | 'weekly';
  dailyAmount?: number; // in cents
  weeklyAmount?: number; // in cents
  targetAmount: number; // in cents
  startDate: string;
  targetCompletionDate: string;
  savingsGoalId?: string;
  autoFund: boolean;
  autoFundPaymentMethodId?: string;
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
    milestoneAlerts: boolean;
  };
  visibility: 'private' | 'friends' | 'public';
}

/**
 * Update Plan Request
 */
export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  autoFund?: boolean;
  autoFundPaymentMethodId?: string;
  notifications?: {
    dailyReminder?: boolean;
    weeklyReport?: boolean;
    milestoneAlerts?: boolean;
  };
  visibility?: 'private' | 'friends' | 'public';
}

/**
 * Plan Action Request (Pause/Resume/Cancel)
 */
export interface PlanActionRequest {
  action: 'pause' | 'resume' | 'cancel';
  reason?: string;
  feedback?: string;
}

/**
 * Restart Plan Request
 */
export interface RestartPlanRequest {
  savingsMode?: 'daily' | 'weekly';
  dailyAmount?: number;
  weeklyAmount?: number;
  newTargetAmount?: number;
  startDate: string;
  targetCompletionDate: string;
}

/**
 * API Responses
 */
export interface Save2740PlanResponse {
  success: boolean;
  data?: Save2740Plan;
  error?: string;
}

export interface PlansListResponse {
  success: boolean;
  data?: {
    activePlans: Save2740Plan[];
    completedPlans: Save2740Plan[];
    pausedPlans: Save2740Plan[];
    totalSaved: number;
    totalTarget: number;
  };
  error?: string;
}

export interface PlanSummaryResponse {
  success: boolean;
  data?: PlanSummary;
  error?: string;
}

export interface PlanMilestonesResponse {
  success: boolean;
  data?: PlanMilestone[];
  error?: string;
}

export interface PlanContributionsResponse {
  success: boolean;
  data?: PlanContribution[];
  error?: string;
}

export interface PlanCompletionResponse {
  success: boolean;
  data?: PlanCompletionData;
  error?: string;
}

export interface PlanActionResponse {
  success: boolean;
  data?: Save2740Plan;
  error?: string;
}

export interface RestartPlanResponse {
  success: boolean;
  data?: Save2740Plan;
  error?: string;
}
