import mongoose, { Schema, Document } from 'mongoose';

export interface IPocket extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    targetAmount: number;
    currentAmount: number;
    icon?: string;
    color?: string;
    deadline?: Date;
    dailyAmount: number;
    multiplier: number;
    status: 'active' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const PocketSchema = new Schema<IPocket>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    icon: { type: String },
    color: { type: String },
    deadline: { type: Date },
    dailyAmount: { type: Number, default: 0 },
    multiplier: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

export const Pocket = mongoose.models.Pocket || mongoose.model<IPocket>('Pocket', PocketSchema);
