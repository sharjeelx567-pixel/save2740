import mongoose, { Schema, Document } from "mongoose";

export interface ISave2740Plan extends Document {
  userId: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "paused" | "cancelled";
  savingsMode: "daily" | "weekly";
  dailyAmount?: number;
  weeklyAmount?: number;
  totalTargetAmount: number;
  currentBalance: number;
  startDate: Date;
  targetCompletionDate: Date;
  estimatedCompletionDate?: Date;
  completionDate?: Date;
  totalContributions: number;
  contributionCount: number;
  daysActive: number;
  streakDays: number;
  longestStreak: number;
  lastContributionDate?: Date;
  nextContributionDate?: Date;
  autoFund: boolean;
  autoFundPaymentMethodId?: string;
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
    milestoneAlerts: boolean;
  };
  visibility: "private" | "public";
  createdAt: Date;
  updatedAt: Date;
}

const Save2740PlanSchema = new Schema<ISave2740Plan>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
      index: true,
    },
    savingsMode: {
      type: String,
      enum: ["daily", "weekly"],
      required: true,
    },
    dailyAmount: Number,
    weeklyAmount: Number,
    totalTargetAmount: {
      type: Number,
      required: true,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    targetCompletionDate: {
      type: Date,
      required: true,
    },
    estimatedCompletionDate: Date,
    completionDate: Date,
    totalContributions: {
      type: Number,
      default: 0,
    },
    contributionCount: {
      type: Number,
      default: 0,
    },
    daysActive: {
      type: Number,
      default: 0,
    },
    streakDays: {
      type: Number,
      default: 0,
    },
    longestStreak: {
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
    notifications: {
      dailyReminder: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      milestoneAlerts: { type: Boolean, default: true },
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure userId + name is unique per user
Save2740PlanSchema.index({ userId: 1, name: 1 }, { unique: true });

// Get or create model
export const Save2740Plan =
  mongoose.models.Save2740Plan ||
  mongoose.model<ISave2740Plan>("Save2740Plan", Save2740PlanSchema);
