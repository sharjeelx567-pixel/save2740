import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'card' | 'bank_account';
    name: string; // "Chase Checking", "Visa **** 4242"
    last4: string;
    status: 'active' | 'inactive';
    providerId?: string; // Stripe Payment Method ID
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['card', 'bank_account'], required: true },
    name: { type: String, required: true },
    last4: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    providerId: { type: String },
    isDefault: { type: Boolean, default: false }
}, {
    timestamps: true
});

export const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);
