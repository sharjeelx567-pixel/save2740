/**
 * User Profile & KYC Models
 * MongoDB schemas for profile, KYC, and document management
 */

import mongoose from 'mongoose'

// User Profile Schema
export const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthUser',
      required: true,
      unique: true,
    },
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
    phone: String,
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationDate: Date,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    profilePicture: {
      url: String,
      uploadedAt: Date,
    },
    bio: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// KYC Status Schema
export const kycStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthUser',
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'pending', 'verified', 'rejected', 'expired'],
      default: 'not_started',
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    idVerification: {
      status: {
        type: String,
        enum: ['not_started', 'pending', 'verified', 'rejected'],
        default: 'not_started',
      },
      idType: {
        type: String,
        enum: ['passport', 'drivers_license', 'national_id', 'other'],
      },
      idNumber: String,
      expiryDate: Date,
      frontDocument: {
        url: String,
        uploadedAt: Date,
      },
      backDocument: {
        url: String,
        uploadedAt: Date,
      },
      verificationDate: Date,
      rejectionReason: String,
    },
    selfieVerification: {
      status: {
        type: String,
        enum: ['not_started', 'pending', 'verified', 'rejected'],
        default: 'not_started',
      },
      selfieImage: {
        url: String,
        uploadedAt: Date,
      },
      livenessCheck: Boolean,
      verificationDate: Date,
      rejectionReason: String,
    },
    addressVerification: {
      status: {
        type: String,
        enum: ['not_started', 'pending', 'verified', 'rejected'],
        default: 'not_started',
      },
      proofDocument: {
        url: String,
        documentType: String, // utility bill, lease agreement, etc
        uploadedAt: Date,
      },
      verificationDate: Date,
      rejectionReason: String,
    },
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    lastVerificationDate: Date,
    expiryDate: Date,
    notes: String,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Linked Accounts Schema
export const linkedAccountsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthUser',
      required: true,
    },
    accounts: [
      {
        id: String,
        type: {
          type: String,
          enum: ['google', 'facebook', 'apple', 'bank', 'other'],
        },
        provider: String,
        externalId: String,
        email: String,
        linkedAt: {
          type: Date,
          default: Date.now,
        },
        isDefault: Boolean,
        status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
        },
      },
    ],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Account Deletion Request Schema
export const accountDeletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthUser',
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    reason: String,
    feedback: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledDeletionDate: Date,
    completionDate: Date,
    dataArchived: Boolean,
    verificationCode: String,
    verificationCodeExpiry: Date,
    codeVerified: Boolean,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Create models with hot reload safety
const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema)
const KYCStatus = mongoose.models.KYCStatus || mongoose.model('KYCStatus', kycStatusSchema)
const LinkedAccounts = mongoose.models.LinkedAccounts || mongoose.model('LinkedAccounts', linkedAccountsSchema)
const AccountDeletion = mongoose.models.AccountDeletion || mongoose.model('AccountDeletion', accountDeletionSchema)

export { UserProfile, KYCStatus, LinkedAccounts, AccountDeletion }
