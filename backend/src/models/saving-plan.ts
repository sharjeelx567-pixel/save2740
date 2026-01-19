/**
 * Saving Plan Model
 * Stores user's Save2740 plans, goals, and progress
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingPlan extends Document {
  userId: string;
  planName: string;
  targetAmount: number; // in cents
  currentAmount: number; // in cents
  description: string;
  savingsMode: 'daily' | 'weekly' | 'custom';
  dailyAmount?: number; // in cents
  weeklyAmount?: number; // in cents
  weeklyDayOfWeek?: number; // 0-6
  startDate: Date;
  targetDate?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  category: 'emergency-fund' | 'vacation' | 'investment' | 'education' | 'purchase' | 'other';
  autoDebitEnabled: boolean;
  autoDebitPaymentMethodId?: string;
  completedAt?: Date;
  pausedAt?: Date;
  cancelledAt?: Date;
  totalContributions: number;
  contributionCount: number;
  lastContributionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savingPlanSchema = new Schema<ISavingPlan>(
  {
    userId: { type: String, required: true, index: true },
    planName: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    description: String,
    savingsMode: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      required: true,
    },
    dailyAmount: Number,
    weeklyAmount: Number,
    weeklyDayOfWeek: Number,
    startDate: { type: Date, required: true },
    targetDate: Date,
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
    },
    category: {
      type: String,
      enum: ['emergency-fund', 'vacation', 'investment', 'education', 'purchase', 'other'],
      default: 'other',
    },
    autoDebitEnabled: { type: Boolean, default: false },
    autoDebitPaymentMethodId: String,
    completedAt: Date,
    pausedAt: Date,
    cancelledAt: Date,
    totalContributions: { type: Number, default: 0 },
    contributionCount: { type: Number, default: 0 },
    lastContributionDate: Date,
  },
  { timestamps: true }
);

// Create indexes
savingPlanSchema.index({ userId: 1, status: 1 });
savingPlanSchema.index({ createdAt: -1 });

export const SavingPlan =
  mongoose.models.SavingPlan || mongoose.model<ISavingPlan>('SavingPlan', savingPlanSchema);
