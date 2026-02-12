import mongoose, { Schema, Document } from 'mongoose';

/**
 * Contribution Wallet Model
 * 
 * Separate wallet dedicated to group contributions (Osusu).
 * This wallet is completely isolated from the savings wallet to prevent fund mixing.
 * 
 * Key Rules:
 * - Only used for group contributions
 * - Cannot be used for regular savings
 * - Can be frozen independently without affecting savings wallet
 * - Has separate limits and balances
 */

export interface IContributionWallet extends Document {
    userId: string;

    // Balances
    balance: number; // Total contributions balance
    escrowBalance: number; // Locked in active groups (cannot withdraw)
    availableBalance: number; // Can withdraw (balance - escrowBalance)

    // Limits
    monthlyContributionLimit: number; // Max contributions per month
    dailyContributionLimit: number; // Max contributions per day
    maxActiveGroups: number; // Max simultaneous active groups

    // Status
    status: 'active' | 'frozen' | 'suspended';
    freezeReason?: string;
    frozenBy?: string; // Admin ID who froze the wallet
    frozenAt?: Date;

    // Stats
    totalContributed: number; // Lifetime contributed to groups
    totalReceived: number; // Lifetime received from groups
    totalRefunds: number; // Lifetime refunds received
    totalPenalties: number; // Lifetime penalties paid
    activeGroupsCount: number; // Current active group count
    completedGroupsCount: number; // Total groups completed

    // Ledger reference for balance verification
    ledgerBalance: number; // Should match balance from ledger
    lastReconciledAt?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const ContributionWalletSchema = new Schema<IContributionWallet>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Balances
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },
        escrowBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        availableBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Limits
        monthlyContributionLimit: {
            type: Number,
            default: 10000, // $100 in cents
        },
        dailyContributionLimit: {
            type: Number,
            default: 2000, // $20 in cents
        },
        maxActiveGroups: {
            type: Number,
            default: 5,
            min: 1,
            max: 20,
        },

        // Status
        status: {
            type: String,
            enum: ['active', 'frozen', 'suspended'],
            default: 'active',
        },
        freezeReason: String,
        frozenBy: String,
        frozenAt: Date,

        // Stats
        totalContributed: {
            type: Number,
            default: 0,
        },
        totalReceived: {
            type: Number,
            default: 0,
        },
        totalRefunds: {
            type: Number,
            default: 0,
        },
        totalPenalties: {
            type: Number,
            default: 0,
        },
        activeGroupsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        completedGroupsCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Ledger reconciliation
        ledgerBalance: {
            type: Number,
            default: 0,
        },
        lastReconciledAt: Date,
    },
    { timestamps: true }
);

// Calculate availableBalance before saving
ContributionWalletSchema.pre<IContributionWallet>('save', function (next) {
    this.availableBalance = Math.max(0, (this.balance || 0) - (this.escrowBalance || 0));
    next();
});

// Indexes for queries
ContributionWalletSchema.index({ userId: 1 }, { unique: true });
ContributionWalletSchema.index({ status: 1 });
ContributionWalletSchema.index({ activeGroupsCount: 1 });

export const ContributionWallet =
    mongoose.models.ContributionWallet ||
    mongoose.model<IContributionWallet>('ContributionWallet', ContributionWalletSchema);
