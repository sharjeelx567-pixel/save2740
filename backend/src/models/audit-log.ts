/**
 * Audit Log Model
 * Compliance and security audit trail
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: string;
  action: string;
  resourceType: 'user' | 'wallet' | 'transaction' | 'pocket' | 'kyc' | 'referral' | 'payment' | 'system';
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['user', 'wallet', 'transaction', 'pocket', 'kyc', 'referral', 'payment', 'system'],
      required: true,
      index: true,
    },
    resourceId: String,
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    changes: [
      {
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
      },
    ],
    metadata: Schema.Types.Mixed,
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // For time-based queries

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
