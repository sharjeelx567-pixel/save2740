/**
 * Chat Log Model - Backend Audit Only
 * Firebase Firestore handles real-time messaging
 * This model stores chat history for compliance/audit
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IChatLog extends Document {
  userId: string;
  adminId?: string;
  message: string;
  senderType: 'user' | 'admin';
  timestamp: Date;
  metadata?: {
    userEmail?: string;
    adminEmail?: string;
    userKycStatus?: string;
    sessionId?: string;
  };
  createdAt: Date;
}

const chatLogSchema = new Schema<IChatLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    adminId: String,
    message: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    metadata: {
      userEmail: String,
      adminEmail: String,
      userKycStatus: String,
      sessionId: String,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
chatLogSchema.index({ userId: 1, timestamp: -1 });
chatLogSchema.index({ adminId: 1, timestamp: -1 });
chatLogSchema.index({ timestamp: -1 });

export const ChatLog =
  mongoose.models.ChatLog || mongoose.model<IChatLog>('ChatLog', chatLogSchema);
