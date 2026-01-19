/**
 * Achievement Model
 * Tracks user milestones and accomplishments in saving goals
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
    userId: string;
    achievementType: 'savings_milestone' | 'streak_milestone' | 'consistency' | 'first_contribution' | 'plan_completed';
    achievementName: string;
    achievementAmount?: number; // For savings milestones: 500, 1000, 2500, 5000, 7500, 10000, 27400
    streakDays?: number; // For streak milestones: 7, 30, 60, 90, 180, 365
    description: string;
    unlockedAt: Date;
    metadata?: {
        planId?: string;
        planName?: string;
        totalSaved?: number;
        contributionCount?: number;
    };
    createdAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
    {
        userId: { type: String, required: true, index: true },
        achievementType: {
            type: String,
            enum: ['savings_milestone', 'streak_milestone', 'consistency', 'first_contribution', 'plan_completed'],
            required: true,
        },
        achievementName: { type: String, required: true },
        achievementAmount: Number,
        streakDays: Number,
        description: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        metadata: {
            planId: String,
            planName: String,
            totalSaved: Number,
            contributionCount: Number,
        },
    },
    { timestamps: true }
);

// Create indexes
achievementSchema.index({ userId: 1, achievementType: 1 });
achievementSchema.index({ userId: 1, unlockedAt: -1 });
achievementSchema.index({ userId: 1, achievementAmount: 1 }, { sparse: true });

// Prevent duplicate achievements
achievementSchema.index(
    { userId: 1, achievementType: 1, achievementAmount: 1 },
    { unique: true, sparse: true }
);

export const Achievement =
    mongoose.models.Achievement || mongoose.model<IAchievement>('Achievement', achievementSchema);
