/**
 * Payment Dispute Model
 * Stores chargeback and dispute information
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentDisputeModel extends Document {
  userId: string;
  transactionId: string;
  amount: number; // in cents
  currency: string;
  status: 'open' | 'under-review' | 'won' | 'lost' | 'cancelled' | 'resolved';
  reason: 'unauthorized' | 'duplicate' | 'fraudulent' | 'service-issue' | 'billing-error' | 'product-not-received' | 'other';
  description: string;
  filedDate: Date;
  deadline: Date;
  responseDeadline?: Date;
  evidence: {
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
  customerStatement?: string;
  bankNotes?: string;
  resolution?: {
    type: 'won' | 'lost' | 'settled';
    resolutionDate: Date;
    notes: string;
    amountAwarded?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const paymentDisputeSchema = new Schema<IPaymentDisputeModel>(
  {
    userId: { type: String, required: true, index: true },
    transactionId: { type: String, required: true }, // Index created below
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['open', 'under-review', 'won', 'lost', 'cancelled', 'resolved'],
      default: 'open',
    },
    reason: {
      type: String,
      enum: ['unauthorized', 'duplicate', 'fraudulent', 'service-issue', 'billing-error', 'product-not-received', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    filedDate: { type: Date, required: true },
    deadline: { type: Date, required: true },
    responseDeadline: Date,
    evidence: [
      {
        type: String,
        url: String,
        uploadedAt: Date,
      },
    ],
    customerStatement: String,
    bankNotes: String,
    resolution: {
      type: {
        type: String,
        enum: ['won', 'lost', 'settled'],
      },
      resolutionDate: Date,
      notes: String,
      amountAwarded: Number,
    },
  },
  { timestamps: true }
);

// Create indexes
paymentDisputeSchema.index({ userId: 1, status: 1 });
paymentDisputeSchema.index({ transactionId: 1 });

export const PaymentDisputeModel =
  mongoose.models.PaymentDisputeModel ||
  mongoose.model<IPaymentDisputeModel>('PaymentDisputeModel', paymentDisputeSchema);
