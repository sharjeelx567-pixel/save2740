/**
 * Initialize Test Group with Active Rounds
 * 
 * This script:
 * 1. Finds the test group
 * 2. Initializes rounds if needed
 * 3. Sets it to active status
 * 4. Adds sample contributions
 */

import mongoose from 'mongoose';
import { Group } from '../src/models/group.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/save2740';

async function initializeTestGroup() {
    try {
        console.log('🔧 Initializing Test Group with Rounds\n');

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find test groups
        const testGroups = await Group.find({
            name: { $regex: /test/i }
        });

        if (testGroups.length === 0) {
            console.log('❌ No test groups found');
            console.log('Run: npx ts-node scripts/quick-test-setup.ts');
            return;
        }

        console.log(`Found ${testGroups.length} test group(s)\n`);

        for (const group of testGroups) {
            console.log(`\n📊 Group: ${group.name} (${group._id})`);
            console.log(`  Status: ${group.status}`);
            console.log(`  Members: ${group.currentMembers}/${group.maxMembers}`);
            console.log(`  Rounds: ${group.rounds.length}`);

            // If group is locked, activate it
            if (group.status === 'locked' && group.currentMembers >= group.minMembers) {
                console.log('\n  🔓 Unlocking and activating group...');
                group.status = 'active';
                group.startDate = new Date();

                // Initialize rounds if not already done
                if (group.rounds.length === 0) {
                    console.log('  📅 Initializing rounds...');
                    group.totalRounds = group.currentMembers;

                    // Create rounds for each member
                    for (let i = 0; i < group.currentMembers; i++) {
                        const round = {
                            roundNumber: i + 1,
                            recipientId: group.members[i].userId,
                            recipientName: group.members[i].name,
                            dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000), // 7 days apart
                            status: i === 0 ? 'in_progress' : 'pending',
                            contributions: [],
                            totalContributed: 0,
                            expectedTotal: group.contributionAmount * group.currentMembers,
                            startedAt: i === 0 ? new Date() : undefined
                        };
                        group.rounds.push(round as any);
                    }

                    group.currentRound = 1;
                    console.log(`  ✅ Created ${group.totalRounds} rounds`);
                }

                // Add sample contributions for current round
                const currentRound = group.rounds[0];
                console.log('\n  💰 Adding sample contributions to Round 1...');

                // Add contributions from first 2 members (partial funding)
                for (let i = 0; i < Math.min(2, group.members.length); i++) {
                    const member = group.members[i];

                    // Check if already contributed
                    const alreadyContributed = currentRound.contributions?.some(
                        (c: any) => c.userId.toString() === member.userId.toString()
                    );

                    if (!alreadyContributed) {
                        currentRound.contributions = currentRound.contributions || [];
                        currentRound.contributions.push({
                            userId: member.userId,
                            name: member.name,
                            amount: group.contributionAmount,
                            paidAt: new Date(),
                            status: 'completed'
                        } as any);

                        currentRound.totalContributed += group.contributionAmount;
                        group.totalContributed += group.contributionAmount;
                        group.escrowBalance += group.contributionAmount;

                        console.log(`    ✅ ${member.name}: $${group.contributionAmount / 100}`);
                    }
                }

                console.log(`  📊 Round 1 Total: $${currentRound.totalContributed / 100} / $${currentRound.expectedTotal / 100}`);

                await group.save();
                console.log('\n  ✅ Group activated and initialized!');
                console.log(`\n  🎯 Next Steps:`);
                console.log(`     - View in admin panel: http://localhost:3001/groups/${group._id}`);
                console.log(`     - Remaining members need to contribute`);
                console.log(`     - Or use "Trigger Payout" button to force partial payout`);
            } else if (group.status === 'active') {
                console.log('  ✅ Group already active');
                console.log(`  Current Round: ${group.currentRound}/${group.totalRounds}`);
                if (group.rounds.length > 0) {
                    const currentRound = group.rounds[group.currentRound - 1];
                    console.log(`  Round Status: ${currentRound.status}`);
                    console.log(`  Contributions: $${currentRound.totalContributed / 100} / $${currentRound.expectedTotal / 100}`);
                }
            } else {
                console.log(`  ⚠️  Group status: ${group.status} (needs to be locked or active)`);
                console.log(`  Members: ${group.currentMembers}/${group.minMembers} minimum`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n\n👋 Disconnected from MongoDB');
    }
}

initializeTestGroup();
