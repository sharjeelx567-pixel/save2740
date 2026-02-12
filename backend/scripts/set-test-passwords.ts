/**
 * Set Test Passwords Script
 * 
 * This script:
 * 1. Shows current password hashes for test users
 * 2. Sets easy-to-remember test passwords
 * 3. Displays login credentials
 * 
 * Usage: npx ts-node scripts/set-test-passwords.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/auth.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/save2740';

// Test password that will be set for all accounts
const TEST_PASSWORD = 'Test1234!';

const TEST_USERS = [
    'saver@test.com',
    'owner@test.com',
    'member1@test.com',
    'member2@test.com',
];

async function viewCurrentPasswords() {
    console.log('🔍 Current password hashes:\n');

    for (const email of TEST_USERS) {
        const user = await User.findOne({ email }).select('email passwordHash');
        if (user) {
            console.log(`${email}:`);
            console.log(`  Hash: ${user.passwordHash.substring(0, 30)}...`);
            console.log(`  Length: ${user.passwordHash.length} chars`);
            console.log(`  Type: ${user.passwordHash.startsWith('$2a$') ? 'bcrypt' : 'unknown'}`);
            console.log('');
        } else {
            console.log(`${email}: ❌ NOT FOUND\n`);
        }
    }
}

async function setTestPasswords() {
    console.log('🔐 Setting test passwords...\n');

    // Hash the test password once
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);

    console.log(`Password to use: "${TEST_PASSWORD}"`);
    console.log(`Hashed value: ${hashedPassword.substring(0, 30)}...\n`);

    for (const email of TEST_USERS) {
        const user = await User.findOne({ email });
        if (user) {
            // Update password
            user.passwordHash = hashedPassword;
            await user.save();

            // Verify it works
            const isValid = await bcrypt.compare(TEST_PASSWORD, user.passwordHash);

            if (isValid) {
                console.log(`✅ ${email} - Password set successfully`);
            } else {
                console.log(`❌ ${email} - Password verification FAILED`);
            }
        } else {
            console.log(`⚠️  ${email} - User not found, skipping`);
        }
    }
}

async function testLogin() {
    console.log('\n\n🧪 Testing login credentials...\n');

    for (const email of TEST_USERS) {
        const user = await User.findOne({ email });
        if (user) {
            const isValid = await user.comparePassword(TEST_PASSWORD);
            console.log(`${email}: ${isValid ? '✅ CAN LOGIN' : '❌ CANNOT LOGIN'}`);
        }
    }
}

async function displayCredentials() {
    console.log('\n\n📋 === LOGIN CREDENTIALS ===\n');
    console.log('Use these to test:\n');

    const users = await User.find({
        email: { $in: TEST_USERS }
    }).select('email firstName lastName userType');

    for (const user of users) {
        console.log(`${user.firstName} ${user.lastName} (${user.userType}):`);
        console.log(`  Email:    ${user.email}`);
        console.log(`  Password: ${TEST_PASSWORD}`);
        console.log(`  Login:    http://localhost:3000/auth/login`);
        console.log('');
    }

    console.log('===============================\n');
}

async function main() {
    try {
        console.log('🚀 Test Password Setup Script\n');
        console.log('================================\n');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Show current state
        await viewCurrentPasswords();

        console.log('================================\n');

        // Set passwords
        await setTestPasswords();

        // Test login
        await testLogin();

        // Display credentials
        await displayCredentials();

        console.log('✨ Done! You can now login with these credentials.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

main();
