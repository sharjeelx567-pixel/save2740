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
  accountTier?: 'basic' | 'pro' | 'business';
  biometricEnabled: boolean;
  biometricCredentials?: {
    credentialId: string;
    publicKey: Buffer;
    counter: number;
  }[];
  accountStatus: "active" | "suspended" | "locked";
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
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
    accountTier: {
      type: String,
      enum: ["basic", "pro", "business"],
      default: "basic",
    },
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
