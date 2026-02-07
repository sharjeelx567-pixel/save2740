/**
 * Content Model
 * Stores all CMS content (modals, messages, UI text)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  key: string;
  title: string;
  content: string;
  contentType: 'modal' | 'message' | 'notification' | 'email' | 'sms' | 'ui-text' | 'help';
  category: string;
  variables?: string[]; // Placeholders like {{userName}}, {{amount}}
  isActive: boolean;
  language: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ['modal', 'message', 'notification', 'email', 'sms', 'ui-text', 'help'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    variables: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    updatedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
contentSchema.index({ contentType: 1, category: 1 });
contentSchema.index({ key: 1, language: 1 });

export const Content =
  mongoose.models.Content || mongoose.model<IContent>('Content', contentSchema);
