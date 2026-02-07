import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'card' | 'bank_account';
    name: string; // "VISA •••• 4242"
    last4: string;
    brand?: string; // visa, mastercard, amex, etc.
    expMonth?: number;
    expYear?: number;
    fingerprint?: string; // Stripe card fingerprint for duplicate detection
    status: 'active' | 'inactive' | 'deleted';
    stripePaymentMethodId?: string; // Stripe Payment Method ID (pm_xxx)
    stripeCustomerId?: string; // Stripe Customer ID (cus_xxx)
    providerId?: string; // Legacy - use stripePaymentMethodId
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['card', 'bank_account'], required: true },
    name: { type: String, required: true },
    last4: { type: String, required: true },
    brand: { type: String },
    expMonth: { type: Number },
    expYear: { type: Number },
    fingerprint: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' },
    stripePaymentMethodId: { type: String, index: true },
    stripeCustomerId: { type: String },
    providerId: { type: String }, // Legacy support
    isDefault: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Compound index for efficient queries
PaymentMethodSchema.index({ userId: 1, status: 1 });

export const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);
