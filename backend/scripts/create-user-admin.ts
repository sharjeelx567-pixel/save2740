
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/auth.model';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdminUser = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
        if (!mongoUri) {
            throw new Error('MONGODB_URI or DATABASE_URL is not defined in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@save2740.com';
        const adminPassword = 'admin123';

        // Check if user already exists
        const existingUser = await User.findOne({ email: adminEmail });

        if (existingUser) {
            console.log('User already exists in Users collection');

            // Update role to admin if it's not
            if (existingUser.role !== 'admin') {
                existingUser.role = 'admin';
                await existingUser.save();
                console.log('User role updated to admin');
            } else {
                console.log('User is already an admin');
            }

            // Reset password just in case
            existingUser.passwordHash = adminPassword;
            await existingUser.save();
            console.log('Password reset to default');

        } else {
            const newAdmin = new User({
                email: adminEmail,
                passwordHash: adminPassword, // Will be hashed by pre-save hook
                firstName: 'System',
                lastName: 'Admin',
                role: 'admin',
                accountStatus: 'active',
                emailVerified: true
            });

            await newAdmin.save();
            console.log('Admin user created successfully in Users collection');
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
        }

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

createAdminUser();
