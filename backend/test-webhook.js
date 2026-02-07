/**
 * Manual Test Script for Stripe Webhook
 * Run this to simulate a successful payment and see if transactions appear
 */

const axios = require('axios');

// IMPORTANT: Replace these with your actual values
const USER_ID = 'YOUR_USER_ID_HERE'; // Get from MongoDB or frontend localStorage
const AMOUNT = 50.00; // Test amount in dollars

const mockPaymentIntent = {
    id: `pi_test_${Date.now()}`,
    object: 'payment_intent',
    amount: Math.round(AMOUNT * 100), // Convert to cents
    currency: 'usd',
    status: 'succeeded',
    metadata: {
        userId: USER_ID,
        transactionType: 'deposit'
    },
    payment_method: 'pm_test_card',
    created: Math.floor(Date.now() / 1000),
    livemode: false
};

const mockEvent = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'payment_intent.succeeded',
    livemode: false,
    data: {
        object: mockPaymentIntent
    }
};

async function testWebhook() {
    console.log('🧪 Testing Stripe Webhook...\n');
    console.log('Mock Event:', JSON.stringify(mockEvent, null, 2), '\n');

    try {
        const response = await axios.post('http://localhost:5000/api/webhooks/stripe', mockEvent, {
            headers: {
                'Content-Type': 'application/json',
                // Note: In real scenario, Stripe includes a signature header
                // For testing, you may need to temporarily disable signature verification
            }
        });

        console.log('✅ Webhook Response:', response.data);
        console.log('\n📊 Check your database for:');
        console.log(`   - Transaction with externalTransactionId: ${mockPaymentIntent.id}`);
        console.log(`   - Wallet balance increase for user: ${USER_ID}`);
        console.log(`   - Amount: $${AMOUNT}`);
    } catch (error) {
        console.error('❌ Webhook Error:', error.response?.data || error.message);
    }
}

if (USER_ID === 'YOUR_USER_ID_HERE') {
    console.error('❌ Please update USER_ID in test-webhook.js first!');
    console.log('\n💡 To get your USER_ID:');
    console.log('   1. Open browser console (F12)');
    console.log('   2. Run: localStorage.getItem("userId")');
    console.log('   3. Copy the value and paste it in this script\n');
} else {
    testWebhook();
}
