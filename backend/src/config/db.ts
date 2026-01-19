/**
 * MongoDB Connection Manager for Backend
 */

import mongoose, { Mongoose } from 'mongoose';

let cachedConnection: Mongoose | null = null;

/**
 * Connect to MongoDB
 */
export async function connectDB(): Promise<Mongoose> {
    // Check for MongoDB URI
    const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error('DATABASE_URL or MONGODB_URI environment variable is not defined');
    }

    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 2,
    };

    try {
        const mongooseInstance = await mongoose.connect(MONGODB_URI, opts);

        console.log('✅ MongoDB connected successfully');

        // Handle problematic indexes
        try {
            const usersCollection = mongooseInstance.connection.collection('users');
            const indexes = await usersCollection.indexes();

            const problematicIndexes = ['phoneNumber_1', 'userId_1', 'referralCode_1', 'referredBy_1', 'kycStatus_1'];

            for (const index of indexes) {
                if (index.name && problematicIndexes.includes(index.name)) {
                    try {
                        await usersCollection.dropIndex(index.name);
                        console.log(`✓ Dropped index: ${index.name}`);
                    } catch (error) {
                        // Index might not exist, ignore
                    }
                }
            }
        } catch (error) {
            // Silently handle index inspection errors
            if (process.env.NODE_ENV === 'development') {
                console.debug('[DB] Index inspection:', (error as Error).message);
            }
        }

        cachedConnection = mongooseInstance;
        return mongooseInstance;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB(): Promise<void> {
    if (cachedConnection) {
        await mongoose.disconnect();
        cachedConnection = null;
        console.log('MongoDB disconnected');
    }
}

/**
 * Get MongoDB connection status
 */
export function getConnectionStatus(): boolean {
    return mongoose.connection.readyState === 1;
}

export default mongoose;
