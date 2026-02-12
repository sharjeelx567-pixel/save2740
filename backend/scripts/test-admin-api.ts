/**
 * Direct API Test - Check if /api/admin/groups works
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testDirectAPI() {
    try {
        console.log('🧪 Testing /api/admin/groups endpoint directly\n');

        // First, we need an admin token
        // For testing, let's try without auth first to see what error we get
        console.log('Testing WITHOUT authentication...');
        try {
            const response = await axios.get(`${API_URL}/api/admin/groups`);
            console.log('✅ Response received (unexpected - should require auth)');
            console.log('Data:', response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log('✅ Got 401 - Authentication required (expected)');
                console.log('This means the route EXISTS and is protected correctly\n');
            } else if (error.response?.status === 404) {
                console.log('❌ Got 404 - Route not found');
                console.log('Error:', error.response?.data);
            } else {
                console.log('⚠️  Got error:', error.response?.status);
                console.log('Error:', error.response?.data || error.message);
            }
        }

        console.log('\nℹ️  To test with authentication, you need an admin token.');
        console.log('Get it from: localStorage.getItem("admin_token") in browser console');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

testDirectAPI();
