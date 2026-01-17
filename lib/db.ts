/**
 * MongoDB Connection Manager
 * Handles Mongoose connection with connection pooling and error handling
 */

import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin@cluster0.tdf9l0r.mongodb.net/?appName=Cluster0';

if (!MONGODB_URI) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

interface CachedMongoose {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: CachedMongoose;
}

let cached: CachedMongoose = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB
 * Returns cached connection if available, creates new one otherwise
 */
export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(async (mongooseInstance) => {
        // Fix duplicate key indexes on sparse fields if they exist
        // Only log in development and only on first connection
        const isFirstConnection = !global.mongooseCache?.conn;
        try {
          const usersCollection = mongooseInstance.connection.collection('users');
          const indexes = await usersCollection.getIndexes();
          
          // Drop problematic unique indexes on sparse fields
          const problematicIndexes = ['phoneNumber_1', 'userId_1', 'referralCode_1', 'referredBy_1', 'kycStatus_1'];
          
          for (const indexName of problematicIndexes) {
            if (indexes[indexName]) {
              if (isFirstConnection && process.env.NODE_ENV === 'development') {
                console.log(`[DB] Dropping old ${indexName} index...`);
              }
              try {
                await usersCollection.dropIndex(indexName);
                if (isFirstConnection && process.env.NODE_ENV === 'development') {
                  console.log(`[DB] ✓ Successfully dropped ${indexName} index`);
                }
              } catch (dropError) {
                // Only log warnings in development
                if (process.env.NODE_ENV === 'development') {
                  console.debug(`[DB] Index ${indexName} already removed or doesn't exist`);
                }
              }
            }
          }
        } catch (error) {
          // Silently handle index inspection errors
          if (process.env.NODE_ENV === 'development') {
            console.debug('[DB] Index inspection:', (error as Error).message);
          }
        }
        
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error.message);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

/**
 * Get MongoDB connection status
 */
export function getConnectionStatus(): boolean {
  return mongoose.connection.readyState === 1;
}

export default mongoose;
