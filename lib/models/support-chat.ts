import mongoose, { Document, Schema } from 'mongoose';

// Chat Session Interface
export interface IChatSession extends Document {
    userId: mongoose.Types.ObjectId;
    status: 'active' | 'resolved';
    lastMessageAt: Date;
    createdAt: Date;
    resolvedAt?: Date;
    userEmail?: string;
    userName?: string;
}

// Chat Message Interface
export interface IChatMessage extends Document {
    sessionId: mongoose.Types.ObjectId;
    sender: 'user' | 'admin';
    message: string;
    read: boolean;
    createdAt: Date;
}

// Chat Session Schema
const ChatSessionSchema = new Schema<IChatSession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['active', 'resolved'],
            default: 'active',
            index: true,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        userEmail: {
            type: String,
        },
        userName: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Chat Message Schema
const ChatMessageSchema = new Schema<IChatMessage>(
    {
        sessionId: {
            type: Schema.Types.ObjectId,
            ref: 'ChatSession',
            required: true,
            index: true,
        },
        sender: {
            type: String,
            enum: ['user', 'admin'],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
ChatSessionSchema.index({ userId: 1, status: 1 });
ChatSessionSchema.index({ lastMessageAt: -1 });
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });

// Export models
export const ChatSession =
    mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export const ChatMessage =
    mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
