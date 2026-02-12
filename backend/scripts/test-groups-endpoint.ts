/**
 * Test Admin Groups Endpoint
 * Checks if groups are being returned by the API
 */

import mongoose from 'mongoose';
import { Group } from '../src/models/group.model';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/save2740';

async function testAdminGroupsEndpoint() {
    try {
        console.log('🧪 Testing Admin Groups Endpoint\n');
        console.log(`API URL: ${API_URL}/api/admin/groups\n`);

        // First, let's check if groups exist in database
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const groups = await Group.find({});
        console.log(`📊 Groups in database: ${groups.length}\n`);

        if (groups.length > 0) {
            console.log('Sample group:');
            console.log(`  ID: ${groups[0]._id}`);
            console.log(`  Name: ${groups[0].name}`);
            console.log(`  Status: ${groups[0].status}`);
            console.log(`  Members: ${groups[0].currentMembers}`);
            console.log(`  Join Code: ${groups[0].joinCode}`);
            console.log('');
        } else {
            console.log('⚠️  No groups found in database!');
            console.log('Run: npx ts-node scripts/quick-test-setup.ts');
            console.log('');
        }

        await mongoose.disconnect();
        console.log('✅ Test complete\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testAdminGroupsEndpoint();
