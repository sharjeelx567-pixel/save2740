/**
 * Daily Contribution Model
 * Tracks daily savings contributions for streak calculation and history
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyContribution extends Document {
    userId: string;
    date: Date; // Date of contribution (normalized to start of day)
    amount: number; // in cents
    status: 'completed' | 'pending' | 'failed';
    planId?: string; // Associated savings plan
    transactionId?: string; // Link to transaction record
    paymentMethodId?: string;
    paymentMethodType?: 'bank-account' | 'debit-card';
    isAutoDebit: boolean;
    failureReason?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const dailyContributionSchema = new Schema<IDailyContribution>(
    {
        userId: { type: String, required: true, index: true },
        date: { type: Date, required: true, index: true },
        amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            default: 'pending',
        },
        planId: { type: String, index: true },
        transactionId: String,
        paymentMethodId: String,
        paymentMethodType: {
            type: String,
            enum: ['bank-account', 'debit-card'],
        },
        isAutoDebit: { type: Boolean, default: false },
        failureReason: String,
        completedAt: Date,
    },
    { timestamps: true }
);

// Create compound indexes for efficient queries
dailyContributionSchema.index({ userId: 1, date: -1 });
dailyContributionSchema.index({ userId: 1, status: 1 });
dailyContributionSchema.index({ userId: 1, date: -1, status: 1 });

// Ensure one contribution per user per day
dailyContributionSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyContribution =
    mongoose.models.DailyContribution ||
    mongoose.model<IDailyContribution>('DailyContribution', dailyContributionSchema);
