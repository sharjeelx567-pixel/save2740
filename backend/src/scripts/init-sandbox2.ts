import { connectDB } from '../config/db';
import { Wallet } from '../models/wallet.model';

/**
 * Initialize Sandbox2 Wallet for Promotional Bonuses
 * Run this script once to create the sandbox2 system wallet
 */

async function initializeSandbox2Wallet() {
    try {
        await connectDB();

        // Check if sandbox2 already exists
        const existing = await Wallet.findOne({ userId: 'sandbox2' });

        if (existing) {
            console.log('✅ Sandbox2 wallet already exists');
            console.log(`   Balance: $${existing.balance}`);
            console.log(`   Available: $${existing.availableBalance}`);
            return;
        }

        // Create sandbox2 wallet with initial balance
        const sandboxWallet = await Wallet.create({
            userId: 'sandbox2',
            balance: 10000, // $10,000 initial promotional budget
            availableBalance: 10000,
            locked: 0,
            lockedInPockets: 0,
            referralEarnings: 0,
            currentStreak: 0,
            dailySavingAmount: 0,
            status: 'active'
        });

        console.log('🎉 Sandbox2 wallet created successfully!');
        console.log(`   User ID: ${sandboxWallet.userId}`);
        console.log(`   Initial Balance: $${sandboxWallet.balance}`);
        console.log(`   Purpose: Promotional bonuses (referrals, welcome bonuses, etc.)`);
        console.log('\n✅ Ready to fund user referral bonuses!');

    } catch (error) {
        console.error('❌ Error creating sandbox2 wallet:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run the script
initializeSandbox2Wallet();
