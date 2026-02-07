import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IUser extends Document {
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  passwordHash: string;
  profileImage?: string;
  emailVerified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  referralCode?: string;
  referredBy?: string;
  stripeCustomerId?: string;
  accountTier?: 'basic' | 'pro' | 'business';
  dateOfBirth?: Date;
  bio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    currency?: string;
    language?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    autoDebit?: {
      enabled: boolean;
      amount: number;
      frequency: 'daily' | 'weekly' | 'monthly';
      paymentMethodId?: string | null;
      nextDebitDate?: Date;
    };
  };
  biometricEnabled: boolean;
  biometricCredentials?: {
    credentialId: string;
    publicKey: Buffer;
    counter: number;
  }[];
  fcmToken?: string;
  fcmTokens?: string[];
  role: "user" | "admin";
  accountStatus: "active" | "suspended" | "locked";
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  lockUntil?: Date;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hashPassword(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      sparse: true,
      trim: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
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
    phoneNumber: {
      type: String,
      sparse: true,
      trim: true,
      unique: false,
    },
    passwordHash: {
      type: String,
      required: true,
      // minlength validation removed - will be validated by pre-save hook after hashing
    },
    profileImage: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    biometricEnabled: {
      type: Boolean,
      default: false,
    },
    biometricCredentials: [
      {
        credentialId: String,
        publicKey: Buffer,
        counter: Number,
      },
    ],
    fcmToken: {
      type: String,
      sparse: true,
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "locked"],
      default: "active",
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: Date,
    lockUntil: Date,
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    referralCode: {
      type: String,
      sparse: true,
      trim: true,
      unique: false,
    },
    referredBy: {
      type: String,
      sparse: true,
      trim: true,
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
      trim: true
    },
    accountTier: {
      type: String,
      enum: ["basic", "pro", "business"],
      default: "basic",
    },
    dateOfBirth: Date,
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    preferences: {
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        marketing: { type: Boolean, default: true },
        security: { type: Boolean, default: true }
      },
      autoDebit: {
        enabled: { type: Boolean, default: false },
        amount: { type: Number, default: 27.40 },
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
        paymentMethodId: { type: String, default: null },
        nextDebitDate: { type: Date }
      }
    }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash if password is plaintext (less than 60 chars, bcrypt hash is always 60)
  if (this.passwordHash && this.passwordHash.length < 60) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error) {
      console.error("Password hashing error:", error);
      return next(error as Error);
    }
  }
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// =========== SESSION MODEL ===========

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshTokenExpiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    refreshTokenExpiresAt: {
      type: Date,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    revokedAt: Date,
  },
  { timestamps: true }
);

// Automatic cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// =========== EMAIL VERIFICATION MODEL ===========

export interface IEmailVerification extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  code: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  lastAttempt?: Date;
  verified: boolean;
  verifiedAt?: Date;
  type?: string;
  createdAt: Date;
}

const EmailVerificationSchema = new Schema<IEmailVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttempt: Date,
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    type: {
      type: String,
      default: 'signup'
    }
  },
  { timestamps: true }
);

// =========== OTP VERIFICATION MODEL ===========

export interface IOTPVerification extends Document {
  userId: mongoose.Types.ObjectId;
  phoneNumber: string;
  otp: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  lastAttempt?: Date;
  verified: boolean;
  verifiedAt?: Date;
  type?: string;
  createdAt: Date;
}

const OTPVerificationSchema = new Schema<IOTPVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    lastAttempt: Date,
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    type: {
      type: String,
      default: 'login'
    }
  },
  { timestamps: true }
);

// =========== PASSWORD RESET MODEL ===========

export interface IPasswordReset extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  token: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: Date,
  },
  { timestamps: true }
);

// Create or get models
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
export const EmailVerification =
  mongoose.models.EmailVerification ||
  mongoose.model<IEmailVerification>("EmailVerification", EmailVerificationSchema);
export const OTPVerification =
  mongoose.models.OTPVerification ||
  mongoose.model<IOTPVerification>("OTPVerification", OTPVerificationSchema);
export const PasswordReset =
  mongoose.models.PasswordReset ||
  mongoose.model<IPasswordReset>("PasswordReset", PasswordResetSchema);
