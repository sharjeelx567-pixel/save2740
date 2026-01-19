/**
 * Fee Disclosure Model
 * Transparent fee tracking and disclosure
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeDisclosure extends Document {
  transactionType: 'deposit' | 'withdrawal' | 'wallet-topup' | 'subscription' | 'pocket-creation' | 'premium-feature';
  feeStructure: {
    type: 'percentage' | 'fixed' | 'percentage-plus-fixed';
    percentage?: number; // e.g., 2.9 for 2.9%
    fixedAmount?: number; // e.g., 0.30
    minimumFee?: number;
    maximumFee?: number;
  };
  description: string;
  currency: string;
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  regulatoryNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feeDisclosureSchema = new Schema<IFeeDisclosure>(
  {
    transactionType: {
      type: String,
      enum: ['deposit', 'withdrawal', 'wallet-topup', 'subscription', 'pocket-creation', 'premium-feature'],
      required: true,
      index: true,
    },
    feeStructure: {
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'percentage-plus-fixed'],
        required: true,
      },
      percentage: Number,
      fixedAmount: Number,
      minimumFee: Number,
      maximumFee: Number,
    },
    description: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: Date,
    regulatoryNotes: String,
  },
  { timestamps: true }
);

// Indexes
feeDisclosureSchema.index({ transactionType: 1, isActive: 1 });
feeDisclosureSchema.index({ effectiveDate: 1, expiryDate: 1 });

export const FeeDisclosure =
  mongoose.models.FeeDisclosure || mongoose.model<IFeeDisclosure>('FeeDisclosure', feeDisclosureSchema);
