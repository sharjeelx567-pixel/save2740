import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== INTERFACES ====================

export interface IGroupMember {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    joinedAt: Date;
    totalContributed: number;
    payoutPosition: number;
    status: 'active' | 'inactive' | 'removed' | 'chain_broken';
    lastContributionDate?: Date;
    missedContributions: number;
}

export interface IContribution {
    userId: mongoose.Types.ObjectId;
    amount: number;
    paidAt: Date;
    status: 'paid' | 'pending' | 'late' | 'missed';
    transactionId?: mongoose.Types.ObjectId;
    lateFee?: number;
}

export interface IRound {
    roundNumber: number;
    dueDate: Date;
    recipientId: mongoose.Types.ObjectId;
    recipientName: string;
    expectedAmount: number;
    collectedAmount: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    contributions: IContribution[];
    payoutTransactionId?: mongoose.Types.ObjectId;
    payoutDate?: Date;
    completedAt?: Date;
}

export interface IGroup extends Document {
    // Basic Info
    name: string;
    purpose: string;
    currency: string;
    contributionAmount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    minMembers: number;
    maxMembers: number;
    payoutOrderRule: 'as-joined' | 'random' | 'manual';
    rules?: string;

    // Chain Break Rules
    forfeitOnMissedPayment: boolean;
    gracePeriodHours: number;
    lateFeePercentage: number;
    chainBreakPenaltyDays: number;

    // Lifecycle Dates
    startDate: Date;
    endDate?: Date;
    lockedDate?: Date;
    filledDate?: Date;
    autoStartDate?: Date;
    autoEndDate?: Date;

    // Status
    status: 'open' | 'locked' | 'active' | 'completed' | 'failed' | 'at_risk';
    currentRound: number;
    currentMembers: number;

    // Invitation
    joinCode: string;
    referralLink: string;

    // Creator
    creatorId: mongoose.Types.ObjectId;
    creatorEmail: string;

    // Members
    members: IGroupMember[];

    // Rounds
    rounds: IRound[];
    totalRounds: number;

    // Financial
    escrowBalance: number;
    totalBalance: number;
    totalContributed: number;
    totalPaidOut: number;

    // Audit
    chainBreaks: {
        userId: mongoose.Types.ObjectId;
        userName: string;
        roundNumber: number;
        forfeitedAmount: number;
        date: Date;
    }[];

    createdAt: Date;
    updatedAt: Date;
}

// ==================== SCHEMAS ====================

const ContributionSchema = new Schema<IContribution>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paidAt: { type: Date, required: true },
    status: {
        type: String,
        enum: ['paid', 'pending', 'late', 'missed'],
        default: 'pending'
    },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    lateFee: { type: Number, default: 0 }
}, { _id: false });

const RoundSchema = new Schema<IRound>({
    roundNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientName: { type: String, required: true },
    expectedAmount: { type: Number, required: true },
    collectedAmount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        default: 'pending'
    },
    contributions: [ContributionSchema],
    payoutTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    payoutDate: { type: Date },
    completedAt: { type: Date }
}, { _id: false });

const GroupMemberSchema = new Schema<IGroupMember>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    totalContributed: { type: Number, default: 0 },
    payoutPosition: { type: Number, required: true },
    status: {
        type: String,
        enum: ['active', 'inactive', 'removed', 'chain_broken'],
        default: 'active'
    },
    lastContributionDate: { type: Date },
    missedContributions: { type: Number, default: 0 }
}, { _id: false });

const ChainBreakSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    roundNumber: { type: Number, required: true },
    forfeitedAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
}, { _id: false });

const GroupSchema = new Schema<IGroup>(
    {
        // Basic Info
        name: { type: String, required: true, trim: true },
        purpose: { type: String, required: true, trim: true },
        currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP'] },
        contributionAmount: {
            type: Number,
            required: true,
            min: 100,
            max: 5000
        },
        frequency: {
            type: String,
            required: true,
            enum: ['daily', 'weekly', 'monthly']
        },
        // Smart Group Size Limits:
        // 2-5 users → personal, high accountability
        // 6-10 users → best balance (recommended) ⭐
        // 11-20 users → community feel, still manageable
        // >20 users → not recommended (low engagement)
        minMembers: { type: Number, default: 2, min: 2, max: 10 },
        maxMembers: { type: Number, required: true, min: 2, max: 20, default: 10 },
        payoutOrderRule: {
            type: String,
            enum: ['as-joined', 'random', 'manual'],
            default: 'as-joined',
        },
        rules: { type: String, trim: true },

        // Chain Break Rules
        forfeitOnMissedPayment: { type: Boolean, default: true },
        gracePeriodHours: { type: Number, default: 24 },
        lateFeePercentage: { type: Number, default: 5 },
        chainBreakPenaltyDays: { type: Number, default: 90 },

        // Lifecycle Dates
        startDate: { type: Date },
        endDate: { type: Date },
        lockedDate: { type: Date },
        filledDate: { type: Date },
        autoStartDate: { type: Date },
        autoEndDate: { type: Date },

        // Status
        status: {
            type: String,
            required: true,
            default: 'open',
            enum: ['open', 'locked', 'active', 'completed', 'failed', 'at_risk']
        },
        currentRound: { type: Number, default: 0 },
        currentMembers: { type: Number, default: 1 },

        // Invitation
        joinCode: { type: String, required: true, uppercase: true },
        referralLink: { type: String, required: true },

        // Creator
        creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        creatorEmail: { type: String, required: true },

        // Members
        members: [GroupMemberSchema],

        // Rounds
        rounds: [RoundSchema],
        totalRounds: { type: Number, default: 0 },

        // Financial
        escrowBalance: { type: Number, default: 0 },
        totalBalance: { type: Number, default: 0 },
        totalContributed: { type: Number, default: 0 },
        totalPaidOut: { type: Number, default: 0 },

        // Audit
        chainBreaks: [ChainBreakSchema]
    },
    {
        timestamps: true
    }
);

// ==================== INDEXES ====================
GroupSchema.index({ creatorId: 1 });
GroupSchema.index({ joinCode: 1 }, { unique: true });
GroupSchema.index({ 'members.userId': 1 });
GroupSchema.index({ status: 1 });
GroupSchema.index({ startDate: 1 });
GroupSchema.index({ currentRound: 1 });

// ==================== METHODS ====================

/**
 * Lock the group when it reaches max capacity
 */
GroupSchema.methods.lockGroup = function () {
    if (this.status === 'open' && this.currentMembers >= this.maxMembers) {
        this.status = 'locked';
        this.lockedDate = new Date();

        // Set auto start date (3 days grace period)
        const autoStart = new Date();
        autoStart.setDate(autoStart.getDate() + 3);
        this.autoStartDate = autoStart;

        // Calculate end date based on frequency and member count
        const autoEnd = new Date(autoStart);
        if (this.frequency === 'daily') {
            autoEnd.setDate(autoEnd.getDate() + this.currentMembers);
        } else if (this.frequency === 'weekly') {
            autoEnd.setDate(autoEnd.getDate() + (this.currentMembers * 7));
        } else if (this.frequency === 'monthly') {
            autoEnd.setMonth(autoEnd.getMonth() + this.currentMembers);
        }
        this.autoEndDate = autoEnd;

        return true;
    }
    return false;
};

/**
 * Initialize rounds when group starts
 */
GroupSchema.methods.initializeRounds = function () {
    if (this.status !== 'locked' && this.status !== 'active') return false;

    this.rounds = [];
    this.totalRounds = this.currentMembers;

    const startDate = this.autoStartDate || new Date();

    for (let i = 0; i < this.currentMembers; i++) {
        const roundDate = new Date(startDate);

        // Calculate due date based on frequency
        if (this.frequency === 'daily') {
            roundDate.setDate(roundDate.getDate() + i);
        } else if (this.frequency === 'weekly') {
            roundDate.setDate(roundDate.getDate() + (i * 7));
        } else if (this.frequency === 'monthly') {
            roundDate.setMonth(roundDate.getMonth() + i);
        }

        const recipient = this.members[i];

        this.rounds.push({
            roundNumber: i + 1,
            dueDate: roundDate,
            recipientId: recipient.userId,
            recipientName: recipient.name,
            expectedAmount: this.contributionAmount * this.currentMembers,
            collectedAmount: 0,
            status: 'pending',
            contributions: []
        });
    }

    this.status = 'active';
    this.currentRound = 1;
    this.startDate = startDate;

    return true;
};

/**
 * Process a contribution for the current round
 */
GroupSchema.methods.recordContribution = function (userId: mongoose.Types.ObjectId, amount: number, transactionId?: mongoose.Types.ObjectId) {
    if (this.status !== 'active') return { success: false, error: 'Group is not active' };
    if (this.currentRound > this.totalRounds) return { success: false, error: 'All rounds completed' };

    const currentRound = this.rounds[this.currentRound - 1];
    if (!currentRound) return { success: false, error: 'Invalid round' };

    // Check if user already contributed
    const existingContribution = currentRound.contributions.find(
        (c: IContribution) => c.userId.toString() === userId.toString()
    );

    if (existingContribution) {
        return { success: false, error: 'Already contributed this round' };
    }

    // Calculate late fee if applicable
    let lateFee = 0;
    const now = new Date();
    const graceDeadline = new Date(currentRound.dueDate);
    graceDeadline.setHours(graceDeadline.getHours() + this.gracePeriodHours);

    let status: 'paid' | 'late' = 'paid';
    if (now > currentRound.dueDate) {
        if (now <= graceDeadline) {
            status = 'late';
            lateFee = (this.contributionAmount * this.lateFeePercentage) / 100;
        } else {
            return { success: false, error: 'Grace period expired - chain broken' };
        }
    }

    // Add contribution
    currentRound.contributions.push({
        userId,
        amount,
        paidAt: now,
        status,
        transactionId,
        lateFee
    });

    currentRound.collectedAmount += amount;
    this.escrowBalance += amount;

    // Update member contribution
    const member = this.members.find((m: IGroupMember) => m.userId.toString() === userId.toString());
    if (member) {
        member.totalContributed += amount;
        member.lastContributionDate = now;
    }

    // Check if round is complete
    if (currentRound.contributions.length === this.currentMembers) {
        currentRound.status = 'completed';
    } else {
        currentRound.status = 'in_progress';
    }

    return { success: true, round: currentRound };
};

export const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
