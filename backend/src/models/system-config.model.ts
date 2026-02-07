/**
 * System Configuration Model
 * Stores all admin-configurable system settings
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: 'auth' | 'kyc' | 'wallet' | 'payments' | 'save2740' | 'notifications' | 'general';
  description: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'object', 'array'],
      required: true,
    },
    category: {
      type: String,
      enum: ['auth', 'kyc', 'wallet', 'payments', 'save2740', 'notifications', 'general'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
systemConfigSchema.index({ category: 1, key: 1 });

export const SystemConfig =
  mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
