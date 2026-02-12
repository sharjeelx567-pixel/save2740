/**
 * Simple: Activate Test Group
 * Makes the test group active and ready for payouts
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/save2740';

async function activateTestGroup() {
    try {
        console.log('🔧 Activating Test Group\n');

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false }));

        // Find test group
        const group = await Group.findOne({ name: /test/i });

        if (!group) {
            console.log('❌ No test group found');
            return;
        }

        console.log(`📊 Group: ${group.name}`);
        console.log(`   Status: ${group.status}`);
        console.log(`   Members: ${group.currentMembers}`);

        // Update to active with rounds
        if (group.status === 'locked') {
            group.status = 'active';
            group.startDate = new Date();
            group.currentRound = 1;
            group.totalRounds = group.currentMembers;

            // Initialize rounds array if empty
            if (!group.rounds || group.rounds.length === 0) {
                group.rounds = [];
                for (let i = 0; i < group.currentMembers; i++) {
                    const member = group.members[i];
                    group.rounds.push({
                        roundNumber: i + 1,
                        recipientId: member.userId,
                        recipientName: member.name,
                        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
                        status: i === 0 ? 'in_progress' : 'pending',
                        contributions: [],
                        totalContributed: 0,
                        expectedTotal: group.contributionAmount * group.currentMembers,
                        startedAt: i === 0 ? new Date() : null
                    });
                }
            }

            await group.save();
            console.log('\n✅ Group activated!');
            console.log(`   Current Round: ${group.currentRound}`);
            console.log(`   Total Rounds: ${group.totalRounds}`);
            console.log(`\n🎯 View in admin panel: http://localhost:3001/groups/${group._id}`);
        } else {
            console.log(`\n⚠️  Group is already ${group.status}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Done');
    }
}

activateTestGroup();
