import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrerId: string; // User who referred
  referredId: string; // User who was referred
  referralCode: string; // Unique referral code
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  earnings: number; // Total earnings from this referral
  bonusEarned: number; // Bonus amount earned
  bonusPaid: number; // Amount already paid out
  signupDate: Date; // When referred user signed up
  firstContributionDate?: Date; // When referred user made first contribution
  lastPayoutDate?: Date;
  metadata?: {
    signupSource?: string;
    campaignId?: string;
  };
  rewardPaid?: boolean;
  rewardPaidAt?: Date;
  referrerBonusAmount?: number;
  referredBonusAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferralCode extends Document {
  userId: string;
  code: string; // Unique referral code
  isActive: boolean;
  totalReferrals: number;
  totalEarnings: number;
  totalPayouts: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: String,
      required: true,
      index: true,
    },
    referredId: {
      type: String,
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    bonusEarned: {
      type: Number,
      default: 0,
    },
    bonusPaid: {
      type: Number,
      default: 0,
    },
    signupDate: {
      type: Date,
      required: true,
    },
    firstContributionDate: Date,
    lastPayoutDate: Date,
    metadata: {
      signupSource: String,
      campaignId: String,
    },
    rewardPaid: {
      type: Boolean,
      default: false,
    },
    rewardPaidAt: Date,
    referrerBonusAmount: Number,
    referredBonusAmount: Number,
  },
  {
    timestamps: true,
  }
);

// Ensure one referral per referrer-referred pair
ReferralSchema.index({ referrerId: 1, referredId: 1 }, { unique: true });

const ReferralCodeSchema = new Schema<IReferralCode>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalPayouts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Referral = mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
export const ReferralCode = mongoose.models.ReferralCode || mongoose.model<IReferralCode>('ReferralCode', ReferralCodeSchema);
