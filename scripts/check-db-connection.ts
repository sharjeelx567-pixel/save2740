/**
 * Script to check MongoDB connection
 * Run with: npx ts-node scripts/check-db-connection.ts
 */

import { connectDB, getConnectionStatus } from '../lib/db';
import mongoose from 'mongoose';

async function checkConnection() {
  console.log('🔍 Checking MongoDB Connection...\n');

  // Check environment variable
  const dbUrl = process.env.DATABASE_URL;
  console.log('Environment Variables:');
  console.log(`  DATABASE_URL: ${dbUrl ? `${dbUrl.substring(0, 30)}...` : '❌ NOT SET'}`);
  console.log('');

  // Check current status
  console.log('Current Connection Status:');
  const isConnected = getConnectionStatus();
  const readyState = mongoose.connection.readyState;
  const readyStateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  console.log(`  Status: ${readyStateMap[readyState] || 'unknown'}`);
  console.log(`  Is Connected: ${isConnected ? '✅ YES' : '❌ NO'}`);
  console.log(`  Ready State: ${readyState}`);
  console.log('');

  if (!isConnected) {
    console.log('Attempting to connect...');
    try {
      const conn = await connectDB();
      console.log('✅ Successfully connected to MongoDB!');
      console.log(`  Host: ${mongoose.connection.host}`);
      console.log(`  Port: ${mongoose.connection.port}`);
      console.log(`  Database: ${mongoose.connection.name}`);
      console.log('');

      // Test query
      try {
        const collections = await mongoose.connection.db?.listCollections().toArray();
        console.log(`✅ Database query successful!`);
        console.log(`  Collections found: ${collections?.length || 0}`);
        if (collections && collections.length > 0) {
          console.log('  Collection names:');
          collections.slice(0, 10).forEach((col) => {
            console.log(`    - ${col.name}`);
          });
          if (collections.length > 10) {
            console.log(`    ... and ${collections.length - 10} more`);
          }
        }
      } catch (queryError: any) {
        console.log(`⚠️  Query test failed: ${queryError.message}`);
      }
    } catch (error: any) {
      console.log('❌ Failed to connect to MongoDB');
      console.log(`  Error: ${error.message}`);
      console.log('');
      console.log('Troubleshooting:');
      console.log('  1. Check your DATABASE_URL in .env.local file');
      console.log('  2. Verify MongoDB Atlas IP whitelist includes your IP');
      console.log('  3. Check MongoDB credentials are correct');
      console.log('  4. Ensure MongoDB cluster is running');
      process.exit(1);
    }
  } else {
    console.log('✅ Already connected to MongoDB!');
    console.log(`  Host: ${mongoose.connection.host}`);
    console.log(`  Database: ${mongoose.connection.name}`);
  }

  // Close connection
  await mongoose.disconnect();
  console.log('\n✅ Connection check complete!');
  process.exit(0);
}

checkConnection().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
