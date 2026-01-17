import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroupMember {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    joinedAt: Date;
    totalContributed: number;
    payoutPosition: number;
}

export interface IGroup extends Document {
    name: string;
    purpose: string;
    currency: string;
    contributionAmount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    maxMembers: number;
    payoutOrderRule: 'as-joined' | 'random' | 'rotating';
    rules?: string;
    forfeitOnMissedPayment: boolean; // New rule: Break chain = lose funds

    // Dates
    startDate: Date;
    filledDate?: Date;

    // Status
    status: 'open' | 'filled' | 'active' | 'completed';
    currentMembers: number;

    // Referral
    joinCode: string;
    referralLink: string;

    // Creator
    creatorId: mongoose.Types.ObjectId;
    creatorEmail: string;

    // Members
    members: IGroupMember[];

    // Financial
    totalBalance: number;
    totalContributed: number;

    createdAt: Date;
    updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    totalContributed: { type: Number, default: 0 },
    payoutPosition: { type: Number, required: true }
});

const GroupSchema = new Schema<IGroup>(
    {
        name: { type: String, required: true, trim: true },
        purpose: { type: String, required: true, trim: true },
        currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP'] },
        contributionAmount: { type: Number, required: true, min: 0 },
        frequency: {
            type: String,
            required: true,
            enum: ['daily', 'weekly', 'monthly']
        },
        maxMembers: { type: Number, required: true, min: 2, default: 10 },
        payoutOrderRule: {
            type: String,
            enum: ['as-joined', 'random', 'rotating'],
            default: 'as-joined',
        },
        forfeitOnMissedPayment: {
            type: Boolean,
            default: true,
        },
        rules: { type: String, trim: true },

        startDate: { type: Date, default: Date.now },
        filledDate: { type: Date },

        status: {
            type: String,
            required: true,
            default: 'open',
            enum: ['open', 'filled', 'active', 'completed', 'closed']
        },
        currentMembers: { type: Number, default: 1 },

        joinCode: { type: String, required: true, unique: true, uppercase: true },
        referralLink: { type: String, required: true },

        creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        creatorEmail: { type: String, required: true },

        members: [GroupMemberSchema],

        totalBalance: { type: Number, default: 0 },
        totalContributed: { type: Number, default: 0 }
    },
    {
        timestamps: true
    }
);

// Indexes
GroupSchema.index({ creatorId: 1 });
GroupSchema.index({ joinCode: 1 }, { unique: true });
GroupSchema.index({ 'members.userId': 1 });
GroupSchema.index({ status: 1 });

export const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
