/**
 * KYC Document Model
 * Stores KYC verification documents and status
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IKycDocument extends Document {
  userId: string;
  documentType: 'passport' | 'drivers-license' | 'national-id' | 'utility-bill' | 'bank-statement';
  documentNumber?: string;
  frontImageUrl: string;
  backImageUrl?: string;
  selfieImageUrl?: string;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
  verifiedBy?: string; // Admin/verifier ID
  verifiedAt?: Date;
  expiryDate?: Date;
  metadata?: {
    country?: string;
    issueDate?: Date;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const kycDocumentSchema = new Schema<IKycDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['passport', 'drivers-license', 'national-id', 'utility-bill', 'bank-statement'],
      required: true,
    },
    documentNumber: String,
    frontImageUrl: {
      type: String,
      required: true,
    },
    backImageUrl: String,
    selfieImageUrl: String,
    status: {
      type: String,
      enum: ['pending', 'under-review', 'approved', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    rejectionReason: String,
    verifiedBy: String,
    verifiedAt: Date,
    expiryDate: Date,
    metadata: {
      country: String,
      issueDate: Date,
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
    },
  },
  { timestamps: true }
);

// Indexes
kycDocumentSchema.index({ userId: 1, status: 1 });
kycDocumentSchema.index({ status: 1, createdAt: -1 });

export const KycDocument =
  mongoose.models.KycDocument || mongoose.model<IKycDocument>('KycDocument', kycDocumentSchema);
