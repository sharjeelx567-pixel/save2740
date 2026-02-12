/**
 * Quick Test Script - Osusu Groups & Savings
 * 
 * Run this in your backend to create test data quickly
 * Usage: npx ts-node scripts/quick-test-setup.ts
 */

import mongoose from 'mongoose';
import { User } from '../src/models/auth.model';
import { Wallet } from '../src/models/wallet.model';
import { Group } from '../src/models/group.model';
import { Transaction } from '../src/models/transaction.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/save2740';

async function createTestUsers() {
    console.log('🔧 Creating test users...');

    const testUsers = [
        {
            email: 'saver@test.com',
            firstName: 'Saver',
            lastName: 'Only',
            passwordHash: '$2a$10$test.hash.placeholder', // Will be hashed
            role: 'user',
            userType: 'savings_only',
            totalSavingsDeposits: 100,
            contributionsEnabled: true,
        },
        {
            email: 'owner@test.com',
            firstName: 'Group',
            lastName: 'Owner',
            passwordHash: '$2a$10$test.hash.placeholder',
            role: 'user',
            userType: 'group_owner',
            groupsOwned: 1,
            contributionsEnabled: true,
        },
        {
            email: 'member1@test.com',
            firstName: 'Member',
            lastName: 'One',
            passwordHash: '$2a$10$test.hash.placeholder',
            role: 'user',
            userType: 'contributor',
            groupsJoined: 1,
            contributionsEnabled: true,
        },
        {
            email: 'member2@test.com',
            firstName: 'Member',
            lastName: 'Two',
            passwordHash: '$2a$10$test.hash.placeholder',
            role: 'user',
            userType: 'contributor',
            groupsJoined: 1,
            contributionsEnabled: true,
        },
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
        const existing = await User.findOne({ email: userData.email });
        if (existing) {
            console.log(`  ⚠️  User ${userData.email} already exists, skipping`);
            createdUsers.push(existing);
        } else {
            const user = await User.create({
                ...userData,
                emailVerified: true,
                accountStatus: 'active',
            });
            console.log(`  ✅ Created user: ${userData.email} (${user._id})`);
            createdUsers.push(user);
        }
    }

    return createdUsers;
}

async function createTestWallets(users: any[]) {
    console.log('\n💰 Creating test wallets...');

    for (const user of users) {
        const existing = await Wallet.findOne({ userId: user._id.toString() });
        if (existing) {
            console.log(`  ⚠️  Wallet for ${user.email} already exists, skipping`);
        } else {
            const wallet = await Wallet.create({
                userId: user._id.toString(),
                balance: user.userType === 'savings_only' ? 10000 : 50000, // $100 or $500 in cents
                availableBalance: user.userType === 'savings_only' ? 10000 : 50000,
                locked: 0,
                totalBalance: user.userType === 'savings_only' ? 10000 : 50000,
                status: 'active',
            });
            console.log(`  ✅ Created wallet for ${user.email}: $${wallet.balance / 100}`);
        }
    }
}

async function createTestGroup(owner: any, members: any[]) {
    console.log('\n🔄 Creating test Osusu group...');

    const joinCode = 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const group = await Group.create({
        name: 'Test Osusu Circle',
        purpose: 'Testing group contributions',
        currency: 'USD',
        contributionAmount: 5000, // $50 (max allowed)
        frequency: 'weekly',
        minMembers: 2,
        maxMembers: 4,
        payoutOrderRule: 'as-joined',
        status: 'open',
        currentMembers: 1,
        joinCode,
        referralLink: `http://localhost:3000/join/${joinCode}`,
        creatorId: owner._id,
        creatorEmail: owner.email,
        members: [
            {
                userId: owner._id,
                name: `${owner.firstName} ${owner.lastName}`,
                email: owner.email,
                joinedAt: new Date(),
                totalContributed: 0,
                payoutPosition: 1,
                status: 'active',
                missedContributions: 0,
            },
        ],
        rounds: [],
        totalRounds: 0,
        escrowBalance: 0,
        totalBalance: 0,
        totalContributed: 0,
        totalPaidOut: 0,
        chainBreaks: [],
        forfeitOnMissedPayment: true,
        gracePeriodHours: 24,
        lateFeePercentage: 5,
        chainBreakPenaltyDays: 90,
        contributionsPaused: false,
        atRiskMembers: [],
        defaultedMembers: [],
    });

    console.log(`  ✅ Created group: "${group.name}"`);
    console.log(`  📧 Join Code: ${joinCode}`);
    console.log(`  🔗 Join Link: ${group.referralLink}`);

    // Add other members
    for (const member of members) {
        group.members.push({
            userId: member._id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            joinedAt: new Date(),
            totalContributed: 0,
            payoutPosition: group.currentMembers + 1,
            status: 'active',
            missedContributions: 0,
        });
        group.currentMembers += 1;
    }

    // Lock the group if at max capacity
    if (group.currentMembers >= group.maxMembers) {
        group.status = 'locked';
        group.lockedDate = new Date();

        // Set auto start date (3 days from now)
        const autoStart = new Date();
        autoStart.setDate(autoStart.getDate() + 3);
        group.autoStartDate = autoStart;

        console.log(`  🔒 Group locked (full capacity)`);
        console.log(`  📅 Auto-start date: ${autoStart.toLocaleDateString()}`);
    }

    await group.save();

    return group;
}

async function createTestTransactions(users: any[]) {
    console.log('\n💳 Creating test transactions...');

    const saverUser = users.find(u => u.email === 'saver@test.com');

    if (saverUser) {
        // Create deposit transaction
        await Transaction.create({
            userId: saverUser._id,
            type: 'deposit',
            amount: 10000, // $100
            status: 'completed',
            description: 'Test deposit to savings wallet',
            completedAt: new Date(),
        });
        console.log(`  ✅ Created deposit transaction for ${saverUser.email}`);

        // Create daily saving transaction
        await Transaction.create({
            userId: saverUser._id,
            type: 'save_daily',
            amount: 2740, // $27.40
            status: 'completed',
            description: 'Daily savings contribution',
            completedAt: new Date(),
        });
        console.log(`  ✅ Created daily savings transaction for ${saverUser.email}`);
    }
}

async function main() {
    try {
        console.log('🚀 Starting test data setup...\n');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Create test users
        const users = await createTestUsers();

        // Create wallets
        await createTestWallets(users);

        // Create test group
        const owner = users.find(u => u.email === 'owner@test.com');
        const members = users.filter(u => u.email.includes('member'));

        if (owner && members.length > 0) {
            await createTestGroup(owner, members);
        }

        // Create test transactions
        await createTestTransactions(users);

        console.log('\n✨ Test data setup complete!');
        console.log('\n📝 Test Accounts Created:');
        console.log('  1. saver@test.com (Savings Only) - Password: Test1234!');
        console.log('  2. owner@test.com (Group Owner) - Password: Test1234!');
        console.log('  3. member1@test.com (Contributor) - Password: Test1234!');
        console.log('  4. member2@test.com (Contributor) - Password: Test1234!');
        console.log('\n🎯 Next Steps:');
        console.log('  1. Set passwords using reset-password flow or update in DB');
        console.log('  2. Login to frontend: http://localhost:3000');
        console.log('  3. Test savings features with saver@test.com');
        console.log('  4. Test group features with owner@test.com and members');
        console.log('  5. View in admin panel: http://localhost:3001');

    } catch (error) {
        console.error('❌ Error setting up test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

main();
