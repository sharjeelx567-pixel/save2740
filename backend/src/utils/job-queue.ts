/**
 * Background Job Queue System
 * Handles async tasks like sending emails, notifications, etc.
 * Uses Redis for queue management (falls back to in-memory if Redis unavailable)
 */

import { getRedisClient } from '../config/redis';

type JobType = 'email' | 'notification' | 'webhook' | 'analytics' | 'cleanup';

interface Job {
    id: string;
    type: JobType;
    data: any;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    scheduledFor?: Date;
    lastError?: string;
}

interface JobHandler {
    (data: any): Promise<void>;
}

class JobQueue {
    private handlers: Map<JobType, JobHandler> = new Map();
    private inMemoryQueue: Job[] = [];
    private processing: boolean = false;
    private processingInterval: NodeJS.Timeout | null = null;

    /**
     * Register a job handler
     */
    register(type: JobType, handler: JobHandler): void {
        this.handlers.set(type, handler);
        console.log(`✅ Registered handler for job type: ${type}`);
    }

    /**
     * Add a job to the queue
     */
    async add(type: JobType, data: any, options: {
        delay?: number; // Delay in milliseconds
        maxAttempts?: number;
    } = {}): Promise<string> {
        const job: Job = {
            id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            attempts: 0,
            maxAttempts: options.maxAttempts || 3,
            createdAt: new Date(),
            scheduledFor: options.delay ? new Date(Date.now() + options.delay) : undefined
        };

        const redisClient = getRedisClient();

        if (redisClient) {
            try {
                // Store in Redis
                const queueKey = `queue:${type}`;
                await redisClient.rPush(queueKey, JSON.stringify(job));
                console.log(`📋 Job ${job.id} added to Redis queue: ${type}`);
            } catch (error) {
                console.error('Redis queue error, using in-memory:', error);
                this.inMemoryQueue.push(job);
            }
        } else {
            // Fallback to in-memory queue
            this.inMemoryQueue.push(job);
            console.log(`📋 Job ${job.id} added to in-memory queue: ${type}`);
        }

        return job.id;
    }

    /**
     * Start processing jobs
     */
    start(): void {
        if (this.processing) {
            console.warn('Job queue already processing');
            return;
        }

        this.processing = true;
        console.log('🚀 Starting job queue processor');

        // Process jobs every 5 seconds
        this.processingInterval = setInterval(() => {
            this.processJobs();
        }, 5000);

        // Process immediately on start
        this.processJobs();
    }

    /**
     * Stop processing jobs
     */
    stop(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.processing = false;
        console.log('⏹️  Job queue processor stopped');
    }

    /**
     * Process pending jobs
     */
    private async processJobs(): Promise<void> {
        const redisClient = getRedisClient();

        // Process Redis queue
        if (redisClient) {
            for (const type of this.handlers.keys()) {
                try {
                    await this.processRedisQueue(type, redisClient);
                } catch (error) {
                    console.error(`Error processing Redis queue ${type}:`, error);
                }
            }
        }

        // Process in-memory queue
        await this.processInMemoryQueue();
    }

    /**
     * Process Redis queue
     */
    private async processRedisQueue(type: JobType, redisClient: any): Promise<void> {
        const queueKey = `queue:${type}`;

        try {
            const jobData = await redisClient.lPop(queueKey);

            if (!jobData) return; // Queue is empty

            const job: Job = JSON.parse(jobData);

            // Check if job is scheduled for future
            if (job.scheduledFor && new Date(job.scheduledFor) > new Date()) {
                // Re-add to queue
                await redisClient.rPush(queueKey, jobData);
                return;
            }

            await this.executeJob(job);
        } catch (error) {
            console.error(`Error processing Redis job:`, error);
        }
    }

    /**
     * Process in-memory queue
     */
    private async processInMemoryQueue(): Promise<void> {
        const now = new Date();

        for (let i = this.inMemoryQueue.length - 1; i >= 0; i--) {
            const job = this.inMemoryQueue[i];

            if (!job) continue;

            // Check if job is scheduled for future
            if (job.scheduledFor && job.scheduledFor > now) {
                continue;
            }

            // Remove from queue
            this.inMemoryQueue.splice(i, 1);

            // Execute job
            await this.executeJob(job);
        }
    }

    /**
     * Execute a job
     */
    private async executeJob(job: Job): Promise<void> {
        const handler = this.handlers.get(job.type);

        if (!handler) {
            console.error(`No handler registered for job type: ${job.type}`);
            return;
        }

        try {
            console.log(`⚙️  Processing job ${job.id} (${job.type}), attempt ${job.attempts + 1}/${job.maxAttempts}`);

            await handler(job.data);

            console.log(`✅ Job ${job.id} completed successfully`);
        } catch (error: any) {
            job.attempts++;
            job.lastError = error.message;

            console.error(`❌ Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, error.message);

            // Retry if max attempts not reached
            if (job.attempts < job.maxAttempts) {
                console.log(`🔄 Retrying job ${job.id} in 30 seconds...`);

                // Re-add to queue with delay
                await this.add(job.type, job.data, {
                    delay: 30000, // 30 seconds
                    maxAttempts: job.maxAttempts - job.attempts
                });
            } else {
                console.error(`❌ Job ${job.id} failed permanently after ${job.maxAttempts} attempts`);
                // TODO: Store failed job for manual review
            }
        }
    }

    /**
     * Get queue status
     */
    async getStatus(): Promise<{
        inMemory: number;
        redis: { [key: string]: number };
    }> {
        const status = {
            inMemory: this.inMemoryQueue.length,
            redis: {} as { [key: string]: number }
        };

        const redisClient = getRedisClient();
        if (redisClient) {
            for (const type of this.handlers.keys()) {
                try {
                    const count = await redisClient.lLen(`queue:${type}`);
                    status.redis[type] = count;
                } catch (error) {
                    console.error(`Error getting queue length for ${type}:`, error);
                }
            }
        }

        return status;
    }
}

// Export singleton instance
export const jobQueue = new JobQueue();

// Helper functions
export async function addEmailJob(data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}): Promise<string> {
    return jobQueue.add('email', data);
}

export async function addNotificationJob(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
}): Promise<string> {
    return jobQueue.add('notification', data);
}

export async function addWebhookJob(data: {
    url: string;
    method: string;
    headers?: any;
    body?: any;
}, delay?: number): Promise<string> {
    return jobQueue.add('webhook', data, { delay });
}

export async function addAnalyticsJob(data: {
    event: string;
    userId?: string;
    metadata?: any;
}): Promise<string> {
    return jobQueue.add('analytics', data);
}

export default jobQueue;
