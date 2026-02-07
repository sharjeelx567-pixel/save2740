import mongoose, { Schema, Document } from 'mongoose';

/**
 * Webhook Event Model
 * Tracks all incoming webhook events for idempotency and audit
 * Prevents duplicate processing of the same webhook event
 */

export interface IWebhookEvent extends Document {
    eventId: string; // Stripe event ID or external webhook ID
    provider: 'stripe' | 'paypal' | 'other';
    eventType: string; // payment_intent.succeeded, charge.refunded, etc.
    status: 'pending' | 'processing' | 'processed' | 'failed' | 'ignored';
    payload: any; // Full webhook payload
    processedAt?: Date;
    processingAttempts: number;
    lastProcessingError?: string;
    metadata?: {
        userId?: string;
        transactionId?: string;
        amount?: number;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    provider: {
        type: String,
        enum: ['stripe', 'paypal', 'other'],
        default: 'stripe',
        required: true
    },
    eventType: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'processed', 'failed', 'ignored'],
        default: 'pending',
        required: true,
        index: true
    },
    payload: {
        type: Schema.Types.Mixed,
        required: true
    },
    processedAt: {
        type: Date
    },
    processingAttempts: {
        type: Number,
        default: 0
    },
    lastProcessingError: {
        type: String
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
WebhookEventSchema.index({ eventId: 1, provider: 1 });
WebhookEventSchema.index({ status: 1, createdAt: -1 });
WebhookEventSchema.index({ eventType: 1, createdAt: -1 });
WebhookEventSchema.index({ 'metadata.userId': 1, createdAt: -1 });
WebhookEventSchema.index({ 'metadata.transactionId': 1 });

// TTL index - automatically delete old processed webhooks after 90 days
WebhookEventSchema.index(
    { createdAt: 1 },
    { 
        expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
        partialFilterExpression: { status: 'processed' }
    }
);

export const WebhookEvent = mongoose.models.WebhookEvent || 
    mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
