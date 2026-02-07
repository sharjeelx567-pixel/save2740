/**
 * Notification Template Model
 * Stores admin-created notification templates
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationTemplate extends Document {
  name: string;
  type: 'system' | 'security' | 'payment' | 'savings' | 'promo';
  title: string;
  message: string;
  channels: ('push' | 'email' | 'sms' | 'in-app')[];
  isActive: boolean;
  isScheduled: boolean;
  scheduledFor?: Date;
  targetUsers: 'all' | 'specific' | 'active' | 'inactive';
  userIds?: string[];
  variables?: string[];
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  sentAt?: Date;
  sentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const notificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['system', 'security', 'payment', 'savings', 'promo'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    channels: [{
      type: String,
      enum: ['push', 'email', 'sms', 'in-app'],
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledFor: Date,
    targetUsers: {
      type: String,
      enum: ['all', 'specific', 'active', 'inactive'],
      default: 'all',
    },
    userIds: [String],
    variables: [String],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    createdBy: {
      type: String,
      required: true,
    },
    sentAt: Date,
    sentCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
notificationTemplateSchema.index({ type: 1, isActive: 1 });
notificationTemplateSchema.index({ scheduledFor: 1, isScheduled: 1 });

export const NotificationTemplate =
  mongoose.models.NotificationTemplate || 
  mongoose.model<INotificationTemplate>('NotificationTemplate', notificationTemplateSchema);
