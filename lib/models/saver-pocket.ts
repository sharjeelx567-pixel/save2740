/**
 * Saver Pocket Model
 * Enhanced pockets with multipliers (x1-x10) and daily/monthly modes
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISaverPocket extends Document {
  userId: string;
  name: string;
  description?: string;
  multiplier: number; // 1-10
  mode: 'daily' | 'monthly';
  baseAmount: number; // Base daily/monthly amount (e.g., $27.40)
  targetAmount: number; // Total target (baseAmount * multiplier * days/months)
  currentBalance: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  targetCompletionDate: Date;
  completionDate?: Date;
  totalContributions: number;
  contributionCount: number;
  lastContributionDate?: Date;
  nextContributionDate?: Date;
  autoFund: boolean;
  autoFundPaymentMethodId?: string;
  walletPaymentEnabled: boolean; // Can pay with wallet
  subscriptionFee?: number; // Monthly subscription if premium pocket
  createdAt: Date;
  updatedAt: Date;
}

const saverPocketSchema = new Schema<ISaverPocket>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    multiplier: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1,
    },
    mode: {
      type: String,
      enum: ['daily', 'monthly'],
      required: true,
      default: 'daily',
    },
    baseAmount: {
      type: Number,
      required: true,
      default: 27.4, // $27.40/day
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    targetCompletionDate: {
      type: Date,
      required: true,
    },
    completionDate: Date,
    totalContributions: {
      type: Number,
      default: 0,
    },
    contributionCount: {
      type: Number,
      default: 0,
    },
    lastContributionDate: Date,
    nextContributionDate: Date,
    autoFund: {
      type: Boolean,
      default: false,
    },
    autoFundPaymentMethodId: String,
    walletPaymentEnabled: {
      type: Boolean,
      default: true,
    },
    subscriptionFee: Number, // Premium pockets can have monthly fees
  },
  { timestamps: true }
);

// Indexes
saverPocketSchema.index({ userId: 1, status: 1 });
saverPocketSchema.index({ userId: 1, createdAt: -1 });
saverPocketSchema.index({ status: 1, nextContributionDate: 1 });

export const SaverPocket =
  mongoose.models.SaverPocket || mongoose.model<ISaverPocket>('SaverPocket', saverPocketSchema);
