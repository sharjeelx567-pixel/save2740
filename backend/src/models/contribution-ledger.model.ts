import mongoose, { Schema, Document } from 'mongoose';

/**
 * Contribution Ledger Model
 * 
 * Immutable ledger of all contribution wallet transactions.
 * Every change to a contribution wallet MUST have a corresponding ledger entry.
 * This ensures complete auditability and balance verification.
 * 
 * Key Rules:
 * - Immutable - never update, only insert
 * - Every entry records balance before and after
 * - Supports reconciliation with wallet balance
 */

export interface IContributionLedgerEntry extends Document {
    userId: string;
    contributionWalletId: mongoose.Types.ObjectId;

    // Transaction details
    type: 'contribution' | 'payout' | 'refund' | 'penalty' | 'late_fee' | 'escrow_lock' | 'escrow_release' | 'admin_adjustment';
    amount: number; // Positive for credits, negative for debits

    // Group context (if applicable)
    groupId?: mongoose.Types.ObjectId;
    groupName?: string;
    roundNumber?: number;

    // Balance tracking (for reconciliation)
    balanceBefore: number;
    balanceAfter: number;
    escrowBalanceBefore?: number;
    escrowBalanceAfter?: number;

    // Description and metadata
    description: string;
    transactionId?: mongoose.Types.ObjectId; // Link to Transaction model
    metadata?: {
        adminId?: string;
        adminName?: string;
        reason?: string;
        ipAddress?: string;
        [key: string]: any;
    };

    // Timestamps
    createdAt: Date;
}

const ContributionLedgerSchema = new Schema<IContributionLedgerEntry>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        contributionWalletId: {
            type: Schema.Types.ObjectId,
            ref: 'ContributionWallet',
            required: true,
            index: true,
        },

        // Transaction details
        type: {
            type: String,
            required: true,
            enum: [
                'contribution',      // User contributes to group
                'payout',           // User receives payout from group
                'refund',           // Refund from cancelled group
                'penalty',          // Penalty for missed contribution
                'late_fee',         // Late fee charged
                'escrow_lock',      // Funds locked in escrow
                'escrow_release',   // Funds released from escrow
                'admin_adjustment'  // Manual adjustment by admin
            ],
        },
        amount: {
            type: Number,
            required: true,
        },

        // Group context
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'Group',
            index: true,
        },
        groupName: String,
        roundNumber: Number,

        // Balance tracking
        balanceBefore: {
            type: Number,
            required: true,
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        escrowBalanceBefore: Number,
        escrowBalanceAfter: Number,

        // Description
        description: {
            type: String,
            required: true,
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Immutable - no updates
    }
);

// Indexes for efficient queries
ContributionLedgerSchema.index({ userId: 1, createdAt: -1 });
ContributionLedgerSchema.index({ contributionWalletId: 1, createdAt: -1 });
ContributionLedgerSchema.index({ groupId: 1, createdAt: -1 });
ContributionLedgerSchema.index({ type: 1, createdAt: -1 });
ContributionLedgerSchema.index({ transactionId: 1 });

// Prevent updates - ledger is immutable
ContributionLedgerSchema.pre('updateOne', function (next) {
    next(new Error('Ledger entries are immutable and cannot be updated'));
});

ContributionLedgerSchema.pre('findOneAndUpdate', function (next) {
    next(new Error('Ledger entries are immutable and cannot be updated'));
});

export const ContributionLedger =
    mongoose.models.ContributionLedger ||
    mongoose.model<IContributionLedgerEntry>('ContributionLedger', ContributionLedgerSchema);
