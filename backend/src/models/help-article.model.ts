/**
 * Help Article Model
 * Stores help center articles and FAQs
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IHelpArticle extends Document {
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  type: 'faq' | 'guide' | 'troubleshooting' | 'policy';
  isPublished: boolean;
  viewCount: number;
  helpfulCount: number;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const helpArticleSchema = new Schema<IHelpArticle>(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    tags: [String],
    type: {
      type: String,
      enum: ['faq', 'guide', 'troubleshooting', 'policy'],
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    seoTitle: String,
    seoDescription: String,
    createdBy: {
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
helpArticleSchema.index({ category: 1, isPublished: 1, order: 1 });
helpArticleSchema.index({ type: 1, isPublished: 1 });
helpArticleSchema.index({ tags: 1 });

export const HelpArticle =
  mongoose.models.HelpArticle || mongoose.model<IHelpArticle>('HelpArticle', helpArticleSchema);
