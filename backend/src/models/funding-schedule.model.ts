
import mongoose, { Schema, Document } from 'mongoose';

export interface IFundingSchedule extends Document {
    userId: string;
    frequency: 'weekly' | 'monthly';
    amount: number;
    paymentMethodId: string;
    nextRunDate: Date;
    status: 'active' | 'paused' | 'failed';
    lastRunDate?: Date;
    failureReason?: string;
    failureCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const FundingScheduleSchema = new Schema<IFundingSchedule>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        frequency: {
            type: String,
            enum: ['weekly', 'monthly'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        paymentMethodId: {
            type: String,
            required: true,
        },
        nextRunDate: {
            type: Date,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['active', 'paused', 'failed'],
            default: 'active',
        },
        lastRunDate: Date,
        failureReason: String,
        failureCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const FundingSchedule =
    mongoose.models.FundingSchedule || mongoose.model<IFundingSchedule>('FundingSchedule', FundingScheduleSchema);
