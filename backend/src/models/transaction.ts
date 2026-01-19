/**
 * Transaction Model
 * Stores all transaction records (deposits, withdrawals, transfers, savings contributions)
 * NOTE: Payment method details are masked (only last 4 digits stored)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'savings-contribution' | 'refund' | 'fee';
  amount: number; // in cents
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  paymentMethodId?: string;
  paymentMethodLast4?: string;
  paymentMethodType?: 'bank-account' | 'debit-card';
  description: string;
  merchantName?: string;
  transactionId: string; // unique identifier
  authorizationCode?: string;
  savingsPlanId?: string;
  relatedTransactionId?: string; // for refunds, reversals
  fee: number; // in cents
  netAmount: number; // amount - fee
  balanceBefore: number;
  balanceAfter: number;
  metadata?: {
    reference?: string;
    category?: string;
    tags?: string[];
  };
  failureReason?: string;
  failureCode?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'savings-contribution', 'refund', 'fee'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentMethodId: String,
    paymentMethodLast4: String,
    paymentMethodType: {
      type: String,
      enum: ['bank-account', 'debit-card'],
    },
    description: { type: String, required: true },
    merchantName: String,
    transactionId: { type: String, required: true, unique: true }, // unique: true already creates an index
    authorizationCode: String,
    savingsPlanId: { type: String, index: true },
    relatedTransactionId: String,
    fee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    metadata: {
      reference: String,
      category: String,
      tags: [String],
    },
    failureReason: String,
    failureCode: String,
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

// Create indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, status: 1 });
// Note: transactionId index is automatically created by unique: true on line 64

export const Transaction =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
