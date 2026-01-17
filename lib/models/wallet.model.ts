import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  userId: string;
  balance: number;
  availableBalance: number;
  locked: number;
  lockedInPockets: number;
  referralEarnings: number;
  totalBalance: number;
  lastDailySavingDate?: Date;
  currentStreak: number;
  dailySavingAmount: number;
  // External wallet integration
  externalWalletId?: string; // ID from external wallet system
  externalWalletBalance?: number; // Synced balance from external system
  lastWalletSync?: Date;
  walletTopUpUrl?: string; // Deep link to top-up page
  // Wallet payment settings
  walletPaymentEnabled: boolean;
  autoTopUpEnabled: boolean;
  autoTopUpThreshold?: number; // Auto top-up when balance falls below this
  autoTopUpAmount?: number; // Amount to top-up automatically
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    locked: {
      type: Number,
      default: 0,
    },
    lockedInPockets: {
      type: Number,
      default: 0,
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
    lastDailySavingDate: Date,
    currentStreak: {
      type: Number,
      default: 0,
    },
    dailySavingAmount: {
      type: Number,
      default: 27.4,
    },
    // External wallet integration
    externalWalletId: String,
    externalWalletBalance: Number,
    lastWalletSync: Date,
    walletTopUpUrl: String,
    // Wallet payment settings
    walletPaymentEnabled: {
      type: Boolean,
      default: true,
    },
    autoTopUpEnabled: {
      type: Boolean,
      default: false,
    },
    autoTopUpThreshold: Number,
    autoTopUpAmount: Number,
  },
  { timestamps: true }
);

// Calculate totalBalance before saving
WalletSchema.pre<IWallet>("save", function (next) {
  this.totalBalance = this.balance + this.locked + this.referralEarnings;
  next();
});

export const Wallet =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);
