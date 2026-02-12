import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'deposit' | 'withdraw' | 'withdrawal' | 'save_daily' | 'goal_fund' | 'referral_bonus' | 'group_contribution' | 'transfer' | 'refund' | 'fee';
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    description: string;
    paymentMethodId?: string; // ID of the card/bank used if applicable
    referenceId?: string; // External ref (Stripe ID)
    externalTransactionId?: string; // Stripe Payment Intent ID or Transfer ID
    failureReason?: string; // Reason for failure if status is failed
    metadata?: any; // Extra metadata
    transactionId: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: {
        type: String,
        required: true,
        unique: true,
        default: () => `TXN-${require('crypto').randomBytes(6).toString('hex').toUpperCase()}`
    },
    type: {
        type: String,
        required: true,
        enum: ['deposit', 'withdraw', 'withdrawal', 'save_daily', 'goal_fund', 'referral_bonus', 'group_contribution', 'group_payout', 'chain_break_compensation', 'transfer', 'refund', 'fee']
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'completed'
    },
    description: { type: String, default: '' },
    paymentMethodId: { type: String },
    referenceId: { type: String },
    externalTransactionId: { type: String }, // Stripe Payment Intent ID or Transfer ID
    failureReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
    completedAt: { type: Date },
}, {
    timestamps: true
});

// Index for getting user history quickly
TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
