/**
 * Auto-Debit Configuration Model
 * Manages automated recurring payments for wallet top-ups
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAutoDebit extends Document {
    userId: mongoose.Types.ObjectId;
    paymentMethodId: mongoose.Types.ObjectId; // Reference to PaymentMethod
    frequency: 'daily' | 'weekly' | 'monthly';
    amount: number;
    startDate: Date;
    nextDebitDate: Date;
    lastDebitDate?: Date;
    status: 'active' | 'paused' | 'cancelled' | 'failed';
    failureCount: number;
    maxFailureRetries: number;
    lastFailureReason?: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

const AutoDebitSchema = new Schema<IAutoDebit>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    paymentMethodId: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    startDate: {
        type: Date,
        required: true
    },
    nextDebitDate: {
        type: Date,
        required: true
    },
    lastDebitDate: Date,
    status: {
        type: String,
        enum: ['active', 'paused', 'cancelled', 'failed'],
        default: 'active'
    },
    failureCount: {
        type: Number,
        default: 0
    },
    maxFailureRetries: {
        type: Number,
        default: 3
    },
    lastFailureReason: String,
    metadata: Schema.Types.Mixed
}, {
    timestamps: true
});

// Index for finding debits that need processing
AutoDebitSchema.index({ status: 1, nextDebitDate: 1 });

export const AutoDebit = mongoose.models.AutoDebit ||
    mongoose.model<IAutoDebit>('AutoDebit', AutoDebitSchema);
