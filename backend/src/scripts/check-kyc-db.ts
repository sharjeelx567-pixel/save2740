
import { connectDB } from '../config/db';
import { KycDocument } from '../models/kyc-document';
import { User } from '../models/auth.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkDB = async () => {
    try {
        console.log('Connecting to DB...');
        await connectDB();
        console.log('Connected.');

        console.log('--- Checking KycDocuments ---');
        const countDocs = await KycDocument.countDocuments({});
        console.log(`FINAL_COUNT_KYC_DOCS: ${countDocs}`);

        console.log('\n--- Checking Users with status pending ---');
        const countUsers = await User.countDocuments({ kycStatus: 'pending' });
        console.log(`FINAL_COUNT_PENDING_USERS: ${countUsers}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkDB();
