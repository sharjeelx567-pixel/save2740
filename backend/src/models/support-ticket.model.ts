/**
 * Support Ticket Model
 * Stores user support tickets and admin responses
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  ticketNumber: string;
  userId: string;
  subject: string;
  category: 'account' | 'payment' | 'kyc' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting-user' | 'resolved' | 'closed';
  messages: {
    senderId: string;
    senderType: 'user' | 'admin';
    message: string;
    attachments?: string[];
    timestamp: Date;
  }[];
  assignedTo?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['account', 'payment', 'kyc', 'technical', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'waiting-user', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    messages: [{
      senderId: {
        type: String,
        required: true,
      },
      senderType: {
        type: String,
        enum: ['user', 'admin'],
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      attachments: [String],
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    assignedTo: String,
    resolvedAt: Date,
    resolvedBy: String,
    resolutionNotes: String,
    tags: [String],
  },
  { timestamps: true }
);

// Indexes
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

export const SupportTicket =
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
