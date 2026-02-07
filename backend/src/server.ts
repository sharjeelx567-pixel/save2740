// Load environment variables FIRST before any other imports // Trigger restart
import dotenv from 'dotenv';
dotenv.config();

// Now import the rest
import app from './app';
import { connectDB } from './config/db';
import { connectRedis, disconnectRedis } from './config/redis';

const PORT = process.env.PORT || 5000;

// Initialize connections
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('✅ Database connected successfully');

        // Create indexes
        try {
            const { createIndexes } = await import('./utils/db-indexes');
            await createIndexes();
        } catch (error) {
            console.warn('⚠️  Failed to create indexes:', error);
            // Continue anyway, indexes are not critical for startup
        }

        // Connect to Redis (optional in development)
        try {
            await connectRedis();
        } catch (error) {
            if (process.env.NODE_ENV === 'production') {
                throw error;
            }
            console.warn('⚠️  Redis not available, continuing without cache');
        }

        // Initialize Stripe processor if configured
        try {
            if (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET) {
                const { getStripeProcessor } = await import('./utils/stripe-processor');
                const { PaymentProcessorFactory } = await import('./utils/payment-processor');
                const stripeProcessor = getStripeProcessor();
                PaymentProcessorFactory.register('stripe', stripeProcessor);
                console.log('✅ Stripe payment processor initialized');
            }
        } catch (error) {
            console.warn('⚠️  Stripe not configured, using mock processor');
        }

        // Initialize job queue
        try {
            const { registerJobHandlers } = await import('./utils/job-handlers');
            const { jobQueue } = await import('./utils/job-queue');
            registerJobHandlers();
            jobQueue.start();
            console.log('✅ Background job queue started');
        } catch (error) {
            console.warn('⚠️  Failed to start job queue:', error);
        }

        // Initialize cron jobs for scheduled tasks
        try {
            const { initializeCronJobs } = await import('./utils/cron-scheduler');
            initializeCronJobs();
            console.log('✅ Cron jobs initialized');
        } catch (error) {
            console.warn('⚠️  Failed to initialize cron jobs:', error);
        }

        // Start server
        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');

    // Stop cron jobs
    try {
        const { stopAllCronJobs } = await import('./utils/cron-scheduler');
        stopAllCronJobs();
    } catch (error) {
        // Ignore if not initialized
    }

    // Stop job queue
    try {
        const { jobQueue } = await import('./utils/job-queue');
        jobQueue.stop();
    } catch (error) {
        // Ignore if not initialized
    }

    await disconnectRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');

    // Stop cron jobs
    try {
        const { stopAllCronJobs } = await import('./utils/cron-scheduler');
        stopAllCronJobs();
    } catch (error) {
        // Ignore if not initialized
    }

    // Stop job queue
    try {
        const { jobQueue } = await import('./utils/job-queue');
        jobQueue.stop();
    } catch (error) {
        // Ignore if not initialized
    }

    await disconnectRedis();
    process.exit(0);
});
