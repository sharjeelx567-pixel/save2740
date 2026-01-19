import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'payment_success' | 'payment_failed' | 'withdrawal_initiated' | 'withdrawal_completed' | 'referral_bonus' | 'savings_milestone' | 'kyc_status' | 'promotional';
  title: string;
  message: string;
  relatedData?: {
    transactionId?: string;
    withdrawalId?: string;
    referralId?: string;
    amount?: number;
  };
  read: boolean;
  readAt?: Date;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  sentAt: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'payment_success',
        'payment_failed',
        'withdrawal_initiated',
        'withdrawal_completed',
        'referral_bonus',
        'savings_milestone',
        'kyc_status',
        'promotional',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedData: {
      transactionId: String,
      withdrawalId: String,
      referralId: String,
      amount: Number,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    channels: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // TTL index - auto-delete after expiry
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, type: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
