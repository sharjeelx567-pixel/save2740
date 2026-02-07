
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/auth.model';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyAdminUser = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
        if (!mongoUri) {
            throw new Error('MONGODB_URI or DATABASE_URL is not defined in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const email = 'admin@save2740.com';
        const password = 'admin123';

        // 1. Find User
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User NOT found:', email);
            return;
        }
        console.log('✅ User found:', user.email);
        console.log('   Role:', user.role);
        console.log('   Account Status:', user.accountStatus);
        console.log('   Password Hash (first 20 chars):', user.passwordHash.substring(0, 20) + '...');

        // 2. Verify Role
        if (user.role !== 'admin') {
            console.log('❌ Role mismatch. Expected "admin", got:', user.role);
        } else {
            console.log('✅ Role is correct');
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
            console.log('✅ Password comparison SUCCESSFUL');
        } else {
            console.log('❌ Password comparison FAILED');

            // Try to re-hash and update if failed
            console.log('   Attempting to fix password...');
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
            await user.save();
            console.log('   Password updated. Please try logging in again.');

            const retryMatch = await bcrypt.compare(password, user.passwordHash);
            if (retryMatch) console.log('   ✅ Re-verification successful');
        }

    } catch (error) {
        console.error('Error verifying admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

verifyAdminUser();
