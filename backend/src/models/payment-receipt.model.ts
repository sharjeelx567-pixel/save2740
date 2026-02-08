import mongoose, { Schema, Document } from 'mongoose';

/**
 * Payment Receipt Model
 * Stores receipt information for all completed payments
 */

export interface IPaymentReceipt extends Document {
    receiptNumber: string; // Unique receipt number (e.g., RCP-2024-001234)
    userId: mongoose.Types.ObjectId;
    transactionId: string; // Links to Transaction model
    paymentIntentId?: string; // Stripe Payment Intent ID
    amount: number;
    currency: string;
    paymentMethod: {
        type: 'card' | 'bank_account' | 'wallet';
        last4?: string;
        brand?: string;
    };
    paymentDate: Date;
    description: string;
    receiptUrl?: string; // URL to PDF receipt (if generated)
    metadata?: {
        businessName?: string;
        businessAddress?: string;
        taxAmount?: number;
        feeAmount?: number;
        netAmount?: number;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PaymentReceiptSchema = new Schema<IPaymentReceipt>({
    receiptNumber: {
        type: String,
        required: true,
        unique: true,
        default: () => {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `RCP-${new Date().getFullYear()}-${timestamp}-${random}`;
        }
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    paymentIntentId: {
        type: String
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        uppercase: true
    },
    paymentMethod: {
        type: {
            type: String,
            enum: ['card', 'bank_account', 'wallet'],
            required: true
        },
        last4: String,
        brand: String
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        required: true
    },
    receiptUrl: {
        type: String
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
PaymentReceiptSchema.index({ userId: 1, paymentDate: -1 });
PaymentReceiptSchema.index({ transactionId: 1 });
PaymentReceiptSchema.index({ receiptNumber: 1 });
PaymentReceiptSchema.index({ paymentIntentId: 1 });

export const PaymentReceipt = mongoose.models.PaymentReceipt ||
    mongoose.model<IPaymentReceipt>('PaymentReceipt', PaymentReceiptSchema);
