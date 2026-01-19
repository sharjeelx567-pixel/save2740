/**
 * Payment Method Model
 * Stores references to payment methods with tokenized/masked data only
 * NOTE: Full card/bank numbers are NEVER stored - only references and last 4 digits
 * Actual sensitive data is handled by Stripe/Plaid and referenced via their token IDs
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethodModel extends Document {
  userId: string;
  type: 'bank-account' | 'debit-card';
  displayName: string;
  last4: string;
  brand?: string; // visa, mastercard, etc.
  issuer?: string; // bank name
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  isDefault: boolean;
  
  // Stripe/Plaid Token IDs (references, not actual data)
  stripeTokenId?: string; // For cards
  plaidAccountId?: string; // For bank accounts
  stripePaymentMethodId?: string;
  
  // Metadata only
  expiryMonth?: number;
  expiryYear?: number;
  billingZip?: string; // Only zip for AVS verification
  
  linkedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethodModel>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['bank-account', 'debit-card'],
      required: true,
    },
    displayName: { type: String, required: true },
    last4: { type: String, required: true },
    brand: String,
    issuer: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'cancelled'],
      default: 'active',
    },
    isDefault: { type: Boolean, default: false },
    stripeTokenId: String,
    plaidAccountId: String,
    stripePaymentMethodId: String,
    expiryMonth: Number,
    expiryYear: Number,
    billingZip: String,
    linkedAt: { type: Date, required: true },
    lastUsedAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

// Create indexes
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, status: 1 });

export const PaymentMethodModel =
  mongoose.models.PaymentMethodModel ||
  mongoose.model<IPaymentMethodModel>('PaymentMethodModel', paymentMethodSchema);
