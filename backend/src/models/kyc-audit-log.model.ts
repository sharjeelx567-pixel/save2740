/**
 * KYC Audit Log Model
 * Tracks all KYC status changes and admin actions
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IKycAuditLog extends Document {
  kycDocumentId: string;
  userId: string;
  action: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'request_reupload' | 'expired';
  previousStatus?: string;
  newStatus: string;
  performedBy: string; // Admin ID or 'system'
  reason?: string;
  notes?: string;
  metadata?: {
    adminEmail?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  createdAt: Date;
}

const kycAuditLogSchema = new Schema<IKycAuditLog>(
  {
    kycDocumentId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'request_reupload', 'expired'],
      required: true,
    },
    previousStatus: String,
    newStatus: {
      type: String,
      required: true,
    },
    performedBy: {
      type: String,
      required: true,
    },
    reason: String,
    notes: String,
    metadata: {
      adminEmail: String,
      userEmail: String,
      ipAddress: String,
      userAgent: String,
    },
  },
  { timestamps: true }
);

// Indexes
kycAuditLogSchema.index({ kycDocumentId: 1, createdAt: -1 });
kycAuditLogSchema.index({ userId: 1, createdAt: -1 });
kycAuditLogSchema.index({ performedBy: 1, createdAt: -1 });

export const KycAuditLog =
  mongoose.models.KycAuditLog || mongoose.model<IKycAuditLog>('KycAuditLog', kycAuditLogSchema);
