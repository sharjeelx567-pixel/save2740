/**
 * Useful Link Model (CMS)
 * Policy pages, footer links, and legal content editable from Admin.
 * Version history retained for compliance and rollback.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUsefulLinkVersion {
  title: string;
  slug: string;
  content: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface IUsefulLink extends Document {
  title: string;
  slug: string;           // URL path, e.g. "privacy-policy" -> /privacy-policy
  content: string;        // HTML/rich text
  enabled: boolean;       // visibility toggle
  status: 'draft' | 'published' | 'archived';
  displayOrder: number;
  effectiveDate?: Date;   // optional
  lastEditedBy?: string;
  lastEditedAt?: Date;
  versions: IUsefulLinkVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const versionSchema = new Schema<IUsefulLinkVersion>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, required: true },
    updatedBy: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const usefulLinkSchema = new Schema<IUsefulLink>(
  {
    title: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    content: { type: String, required: true, default: '' },
    enabled: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    displayOrder: { type: Number, default: 0 },
    effectiveDate: { type: Date },
    lastEditedBy: { type: String },
    lastEditedAt: { type: Date },
    versions: { type: [versionSchema], default: [] },
  },
  { timestamps: true }
);

usefulLinkSchema.index({ slug: 1 });
usefulLinkSchema.index({ status: 1, enabled: 1 });
usefulLinkSchema.index({ displayOrder: 1 });

export const UsefulLink =
  mongoose.models?.UsefulLink || mongoose.model<IUsefulLink>('UsefulLink', usefulLinkSchema);
