import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  userId: string;
  eventType: 'page_view' | 'button_click' | 'login' | 'logout' | 'form_submission' | 'error' | 'api_call';
  eventName: string;
  page?: string;
  metadata?: {
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  duration?: number; // milliseconds
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['page_view', 'button_click', 'login', 'logout', 'form_submission', 'error', 'api_call'],
      required: true,
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    page: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    duration: Number,
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
analyticsEventSchema.index({ userId: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: -1 }); // For time-range queries
analyticsEventSchema.index({ userId: 1, eventType: 1, createdAt: -1 });

// TTL index - keep analytics for 90 days
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
