import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'deposit' | 'withdraw' | 'save_daily' | 'goal_fund' | 'referral_bonus' | 'group_contribution';
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    description: string;
    paymentMethodId?: string; // ID of the card/bank used if applicable
    referenceId?: string; // External ref (Stripe ID)
    details?: any; // Extra metadata
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        required: true,
        enum: ['deposit', 'withdraw', 'save_daily', 'goal_fund', 'referral_bonus', 'group_contribution']
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    description: { type: String, default: '' },
    paymentMethodId: { type: String },
    referenceId: { type: String },
    details: { type: Schema.Types.Mixed },
}, {
    timestamps: true
});

// Index for getting user history quickly
TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
