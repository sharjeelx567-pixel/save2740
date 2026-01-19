/**
 * Quote of the Day Model
 * Stores quotes and tracks daily rotation
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IQuote extends Document {
  text: string;
  author: string;
  category?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDailyQuote extends Document {
  date: Date; // Date normalized to start of day
  quoteId: mongoose.Types.ObjectId;
  quote: IQuote;
  displayCount: number;
  createdAt: Date;
}

const quoteSchema = new Schema<IQuote>(
  {
    text: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    category: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: Number,
  },
  { timestamps: true }
);

const dailyQuoteSchema = new Schema<IDailyQuote>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: 'Quote',
      required: true,
    },
    displayCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Quote = mongoose.models.Quote || mongoose.model<IQuote>('Quote', quoteSchema);
export const DailyQuote =
  mongoose.models.DailyQuote || mongoose.model<IDailyQuote>('DailyQuote', dailyQuoteSchema);
