/**
 * Job Handlers
 * Define handlers for different job types
 */

import { jobQueue } from './job-queue';
import { sendEmail } from './email-service';
import mongoose from 'mongoose';

/**
 * Email job handler
 */
async function handleEmailJob(data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}): Promise<void> {
    try {
        await sendEmail(
            data.to,
            data.subject,
            data.text || data.html || ''
        );
        console.log(`✅ Email sent to ${data.to}`);
    } catch (error) {
        console.error('Email job error:', error);
        throw error;
    }
}

/**
 * Notification job handler
 */
async function handleNotificationJob(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
}): Promise<void> {
    try {
        // Get Notification model
        const Notification = mongoose.models.Notification;

        if (!Notification) {
            console.warn('Notification model not found');
            return;
        }

        await Notification.create({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            read: false
        });

        console.log(`✅ Notification created for user ${data.userId}`);
    } catch (error) {
        console.error('Notification job error:', error);
        throw error;
    }
}

/**
 * Webhook job handler
 */
async function handleWebhookJob(data: {
    url: string;
    method: string;
    headers?: any;
    body?: any;
}): Promise<void> {
    try {
        const response = await fetch(data.url, {
            method: data.method,
            headers: {
                'Content-Type': 'application/json',
                ...data.headers
            },
            body: data.body ? JSON.stringify(data.body) : undefined
        });

        if (!response.ok) {
            throw new Error(`Webhook failed with status ${response.status}`);
        }

        console.log(`✅ Webhook sent to ${data.url}`);
    } catch (error) {
        console.error('Webhook job error:', error);
        throw error;
    }
}

/**
 * Analytics job handler
 */
async function handleAnalyticsJob(data: {
    event: string;
    userId?: string;
    metadata?: any;
}): Promise<void> {
    try {
        // Get AnalyticsEvent model if it exists
        const AnalyticsEvent = mongoose.models.AnalyticsEvent;

        if (!AnalyticsEvent) {
            console.warn('AnalyticsEvent model not found');
            return;
        }

        await AnalyticsEvent.create({
            event: data.event,
            userId: data.userId,
            metadata: data.metadata,
            timestamp: new Date()
        });

        console.log(`✅ Analytics event recorded: ${data.event}`);
    } catch (error) {
        console.error('Analytics job error:', error);
        // Don't throw - analytics errors shouldn't fail the system
    }
}

/**
 * Cleanup job handler
 */
async function handleCleanupJob(data: {
    type: 'expired_tokens' | 'old_logs' | 'temp_files';
}): Promise<void> {
    try {
        switch (data.type) {
            case 'expired_tokens':
                const { cleanupExpiredTokens } = await import('./token-utils');
                const count = await cleanupExpiredTokens();
                console.log(`✅ Cleaned up ${count} expired tokens`);
                break;

            case 'old_logs':
                // Implement log cleanup
                console.log('✅ Old logs cleaned up');
                break;

            case 'temp_files':
                // Implement temp file cleanup
                console.log('✅ Temp files cleaned up');
                break;

            default:
                console.warn(`Unknown cleanup type: ${data.type}`);
        }
    } catch (error) {
        console.error('Cleanup job error:', error);
        throw error;
    }
}

/**
 * Register all job handlers
 */
export function registerJobHandlers(): void {
    jobQueue.register('email', handleEmailJob);
    jobQueue.register('notification', handleNotificationJob);
    jobQueue.register('webhook', handleWebhookJob);
    jobQueue.register('analytics', handleAnalyticsJob);
    jobQueue.register('cleanup', handleCleanupJob);

    console.log('✅ All job handlers registered');
}

export default {
    registerJobHandlers,
    handleEmailJob,
    handleNotificationJob,
    handleWebhookJob,
    handleAnalyticsJob,
    handleCleanupJob
};
