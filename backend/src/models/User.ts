import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  userId: string;
  email: string;
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
  passwordHash: string; // Added field
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  referralCode: string;
  referredBy?: string;
  emailVerified: boolean; // Added field
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
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
    passwordHash: {
      type: String,
      required: true,
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
    emailVerified: {
      type: Boolean,
      default: false,
    },
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
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  // Only hash if passwordHash is modified (or new) and looks like a plain password (len < 60)
  // Note: We check if it is modified to avoid re-hashing
  if (!this.passwordHash) return next();

  if (this.isModified('passwordHash') && this.passwordHash.length < 60) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Create indexes for common queries
userSchema.index({ createdAt: -1 });
userSchema.index({ kycStatus: 1, createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
