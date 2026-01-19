import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod extends Document {
  userId: string;
  type: 'card' | 'bank_account';
  provider: 'stripe' | 'dwolla' | 'paypal' | 'other'; // Flexible for future providers
  
  // Card Fields
  cardBrand?: string; // visa, mastercard, amex, discover
  cardLastFour?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardHolderName?: string;
  
  // Bank Account Fields
  bankName?: string;
  accountLastFour?: string;
  routingNumber?: string;
  accountType?: 'checking' | 'savings';
  accountHolderName?: string;
  
  // Common Fields
  externalId?: string; // Provider's ID (Stripe token, Dwolla ID, etc.)
  isDefault: boolean;
  isVerified: boolean;
  verificationMethod?: 'instant' | 'micro_deposits' | 'manual';
  verifiedAt?: Date;
  
  // Metadata
  nickname?: string; // "Personal Card", "Business Bank", etc.
  metadata?: {
    [key: string]: any;
  };
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['card', 'bank_account'],
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['stripe', 'dwolla', 'paypal', 'other'],
      required: true,
      index: true,
    },
    
    // Card Fields
    cardBrand: String,
    cardLastFour: String,
    cardExpMonth: Number,
    cardExpYear: Number,
    cardHolderName: String,
    
    // Bank Account Fields
    bankName: String,
    accountLastFour: String,
    routingNumber: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings'],
    },
    accountHolderName: String,
    
    // Common Fields
    externalId: {
      type: String,
      sparse: true,
      unique: true, // Ensure provider IDs are unique
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationMethod: {
      type: String,
      enum: ['instant', 'micro_deposits', 'manual'],
    },
    verifiedAt: Date,
    
    // Metadata
    nickname: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
paymentMethodSchema.index({ userId: 1, createdAt: -1 });
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, type: 1 });
paymentMethodSchema.index({ userId: 1, isVerified: 1 });

// Ensure only one default payment method per user per type
paymentMethodSchema.index(
  { userId: 1, type: 1, isDefault: 1 },
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { isDefault: true, deletedAt: null }
  }
);

export default mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);
