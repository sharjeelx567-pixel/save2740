/**
 * Script to create an admin user
 * Run with: npm run create-admin
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db';
import { User } from '../src/models/auth.model';

async function createAdminUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@save2740.com';
    const adminPassword = 'Admin123!';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', adminEmail);

      // Update role to admin if not already
      if ((existingAdmin as any).role !== 'admin') {
        (existingAdmin as any).role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      }

      // Optionally update password
      console.log('\n🔄 Updating password...');
      existingAdmin.passwordHash = await bcrypt.hash(adminPassword, 10);
      await existingAdmin.save();
      console.log('✅ Password updated');
    } else {
      // Create new admin user
      console.log('🔄 Creating new admin user...');

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await User.create({
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        emailVerified: true,
        accountStatus: 'active',
        kycStatus: 'approved', // Admin doesn't need KYC
        accountTier: 'business',
        phoneVerified: false,
        twoFactorEnabled: false,
        failedLoginAttempts: 0,
      });

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminUser.email);
      console.log('🆔 ID:', adminUser._id);
    }

    console.log('\n✅ Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 You can now login to admin panel at: http://localhost:3001');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdminUser();
