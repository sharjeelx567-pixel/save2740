/**
 * Auto Debit Model
 * Stores automatic recurring payment configurations
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAutoDebitModel extends Document {
  userId: string;
  paymentMethodId: string;
  amount: number; // in cents
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate?: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  purpose: string;
  maxRetries: number;
  failureCount: number;
  nextDebitDate: Date;
  lastDebitDate?: Date;
  lastFailureReason?: string;
  notificationPreference: 'email' | 'sms' | 'both' | 'none';
  createdAt: Date;
  updatedAt: Date;
}

const autoDebitSchema = new Schema<IAutoDebitModel>(
  {
    userId: { type: String, required: true, index: true },
    paymentMethodId: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: Date,
    dayOfMonth: Number,
    dayOfWeek: Number,
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'failed', 'cancelled'],
      default: 'active',
    },
    purpose: { type: String, required: true },
    maxRetries: { type: Number, default: 3 },
    failureCount: { type: Number, default: 0 },
    nextDebitDate: { type: Date, required: true },
    lastDebitDate: Date,
    lastFailureReason: String,
    notificationPreference: {
      type: String,
      enum: ['email', 'sms', 'both', 'none'],
      default: 'email',
    },
  },
  { timestamps: true }
);

// Create indexes
autoDebitSchema.index({ userId: 1, status: 1 });
autoDebitSchema.index({ nextDebitDate: 1, status: 1 });

export const AutoDebitModel =
  mongoose.models.AutoDebitModel || mongoose.model<IAutoDebitModel>('AutoDebitModel', autoDebitSchema);
