import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: string;
  planType: 'yearly' | 'monthly' | 'lifetime';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  appFee: number; // Total app fee for the period
  accruedFees: number; // Fees accrued so far
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date;
  billingCycle: 'yearly' | 'monthly' | 'at_maturity'; // When to charge
  billingHistory: {
    date: Date;
    description: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    transactionId?: string;
  }[];
  autoRenew: boolean;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    planType: {
      type: String,
      enum: ['yearly', 'monthly', 'lifetime'],
      default: 'yearly',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending'],
      default: 'active',
    },
    appFee: {
      type: Number,
      required: true,
      default: 292.80, // $0.80/day × 366 days = $292.80/year
    },
    accruedFees: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    nextBillingDate: Date,
    billingCycle: {
      type: String,
      enum: ['yearly', 'monthly', 'at_maturity'],
      default: 'at_maturity', // Charge when user withdraws
    },
    billingHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ['completed', 'pending', 'failed'],
          required: true,
        },
        transactionId: String,
      },
    ],
    autoRenew: {
      type: Boolean,
      default: true,
    },
    cancelledAt: Date,
    cancelledBy: String,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ nextBillingDate: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
