import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthUser extends Document {
  userId: string;
  email: string;
  password: string; // Hashed password - NEVER store plaintext
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycCompletedAt?: Date;
  profileImage?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  referralCode: string;
  referredBy?: string;
  
  // Payment Processing
  stripeCustomerId?: string;
  
  // Authentication fields
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isActive: boolean;
  
  // Security
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;
  
  // Phone verification
  phoneVerified: boolean;
  phoneVerifiedAt?: Date;
  
  // Biometric authentication
  biometricEnabled: boolean;
  biometricCredential?: string;
  biometricType?: 'fingerprint' | 'face' | 'platform';
  
  createdAt: Date;
  updatedAt: Date;
}

const authUserSchema = new Schema<IAuthUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't return password by default
    },
    phoneNumber: {
      type: String,
      sparse: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    kycCompletedAt: Date,
    profileImage: String,
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
      language: {
        type: String,
        default: 'en',
      },
    },
    referralCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    referredBy: {
      type: String,
      index: true,
    },

    // Payment Processing
    stripeCustomerId: {
      type: String,
      sparse: true,
      index: true,
    },

    // Authentication fields
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
    passwordChangedAt: Date,
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Security
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // Phone verification
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: Date,

    // Biometric authentication
    biometricEnabled: {
      type: Boolean,
      default: false,
    },
    biometricCredential: String,
    biometricType: {
      type: String,
      enum: ['fingerprint', 'face', 'platform'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for authentication
authUserSchema.index({ email: 1 });
authUserSchema.index({ isActive: 1 });
authUserSchema.index({ emailVerified: 1 });
authUserSchema.index({ createdAt: -1 });

export default mongoose.models.AuthUser || mongoose.model<IAuthUser>('AuthUser', authUserSchema);
