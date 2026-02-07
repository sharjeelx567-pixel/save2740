import mongoose, { Schema, Document } from 'mongoose';

/**
 * Double-Entry Ledger System for Wallet Transactions
 * Every transaction creates two entries: debit and credit
 * This ensures accurate financial tracking and auditability
 */

export interface ILedgerEntry extends Document {
    userId: mongoose.Types.ObjectId;
    transactionId: string; // Links to Transaction model
    entryType: 'debit' | 'credit';
    accountType: 'wallet' | 'escrow' | 'pending' | 'locked' | 'referral';
    amount: number;
    balance: number; // Balance after this entry
    currency: string;
    description: string;
    referenceId?: string; // External reference (Stripe ID, etc.)
    metadata?: {
        source?: string;
        destination?: string;
        fee?: number;
        originalAmount?: number;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    entryType: {
        type: String,
        enum: ['debit', 'credit'],
        required: true
    },
    accountType: {
        type: String,
        enum: ['wallet', 'escrow', 'pending', 'locked', 'referral'],
        required: true,
        default: 'wallet'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    balance: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true
    },
    description: {
        type: String,
        required: true
    },
    referenceId: {
        type: String,
        index: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
LedgerEntrySchema.index({ userId: 1, createdAt: -1 });
LedgerEntrySchema.index({ userId: 1, accountType: 1, createdAt: -1 });
LedgerEntrySchema.index({ transactionId: 1 });
LedgerEntrySchema.index({ referenceId: 1 });

export const LedgerEntry = mongoose.models.LedgerEntry || 
    mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
