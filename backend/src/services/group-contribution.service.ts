import mongoose from 'mongoose';
import { Group, IGroup } from '../models/group.model';
import { Transaction } from '../models/transaction.model';
import { Wallet } from '../models/wallet.model';
import { User } from '../models/auth.model';
import { sendEmail } from '../utils/email-service';

/**
 * Group Contribution Service
 * Handles round management, contributions, payouts, and chain-break logic
 */

// ==================== GROUP LOCKING ====================

/**
 * Lock a group when it reaches max capacity
 */
export async function lockGroupIfFull(groupId: string | mongoose.Types.ObjectId) {
    const group = await Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    if (group.status === 'open' && group.currentMembers >= group.maxMembers) {
        // @ts-ignore - TypeScript doesn't know about our custom methods
        const locked = group.lockGroup();

        if (locked) {
            await group.save();

            // Shuffle payout order if random
            if (group.payoutOrderRule === 'random') {
                shufflePayoutOrder(group);
                await group.save();
            }

            // Notify all members
            await notifyGroupLocked(group);

            console.log(`✅ Group ${group.name} (${group._id}) locked. Start: ${group.autoStartDate}`);
        }

        return group;
    }

    return null;
}

/**
 * Shuffle payout positions randomly
 */
function shufflePayoutOrder(group: IGroup) {
    const positions = Array.from({ length: group.members.length }, (_, i) => i + 1);

    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    group.members.forEach((member, index) => {
        member.payoutPosition = positions[index];
    });

    // Sort members by payout position for rounds
    group.members.sort((a, b) => a.payoutPosition - b.payoutPosition);
}

/**
 * Notify all members that group is locked
 */
async function notifyGroupLocked(group: IGroup) {
    for (const member of group.members) {
        try {
            await sendEmail(
                member.email,
                `🎯 Group "${group.name}" is now locked!`,
                `
Hi ${member.name},

The group "${group.name}" has reached its maximum capacity and is now locked.

Group Details:
- Members: ${group.currentMembers}
- Contribution: $${group.contributionAmount} ${group.frequency}
- Your Payout Position: #${member.payoutPosition}
- Start Date: ${group.autoStartDate?.toLocaleDateString()}
- End Date: ${group.autoEndDate?.toLocaleDateString()}

First contribution due: ${group.autoStartDate?.toLocaleDateString()}

View Group: ${process.env.FRONTEND_URL}/groups/${group._id}

Good luck!
Save2740 Team
                `.trim()
            );
        } catch (error) {
            console.error(`Failed to send lock notification to ${member.email}:`, error);
        }
    }
}

// ==================== ROUND INITIALIZATION ====================

/**
 * Initialize rounds for a locked group (call this when auto-start date is reached)
 */
export async function initializeGroupRounds(groupId: string | mongoose.Types.ObjectId) {
    const group = await Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    if (group.status !== 'locked') {
        throw new Error('Group must be locked before initializing rounds');
    }

    // @ts-ignore
    const initialized = group.initializeRounds();

    if (!initialized) {
        throw new Error('Failed to initialize rounds');
    }

    await group.save();

    // Notify members that group has started
    await notifyGroupStarted(group);

    console.log(`✅ Initialized ${group.rounds.length} rounds for group ${group.name}`);

    return group;
}

/**
 * Notify members that group has started
 */
async function notifyGroupStarted(group: IGroup) {
    for (const member of group.members) {
        const round1 = group.rounds[0];

        try {
            await sendEmail(
                member.email,
                `🚀 Group "${group.name}" has started!`,
                `
Hi ${member.name},

The contribution cycle for "${group.name}" has officially started!

First Round Details:
- Due Date: ${round1.dueDate.toLocaleDateString()}
- Your Contribution: $${group.contributionAmount}
- Recipient: ${round1.recipientName}

Important: You must contribute by ${round1.dueDate.toLocaleDateString()} to avoid penalties.

Make Contribution: ${process.env.FRONTEND_URL}/groups/${group._id}

Save2740 Team
                `.trim()
            );
        } catch (error) {
            console.error(`Failed to send start notification to ${member.email}:`, error);
        }
    }
}

// ==================== CONTRIBUTIONS ====================

/**
 * Process a member's contribution
 */
export async function processGroupContribution(
    groupId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    amount: number
) {
    const group = await Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    if (group.status !== 'active') {
        throw new Error('Group is not active');
    }

    // Verify member
    const member = group.members.find(m => m.userId.toString() === userId.toString());
    if (!member) {
        throw new Error('User is not a member of this group');
    }

    if (member.status !== 'active') {
        throw new Error('Member is not active in this group');
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.availableBalance < amount) {
        throw new Error('Insufficient wallet balance');
    }

    // Deduct from wallet
    wallet.availableBalance -= amount;
    wallet.locked += amount; // Lock funds in escrow
    await wallet.save();

    // Create transaction record
    const transaction = await Transaction.create({
        userId,
        type: 'group_contribution',
        amount,
        description: `Group contribution - ${group.name} (Round ${group.currentRound})`,
        status: 'completed',
        metadata: {
            groupId: group._id,
            groupName: group.name,
            roundNumber: group.currentRound,
            contributionType: 'group'
        }
    });

    // Record contribution in group
    // @ts-ignore
    const result = group.recordContribution(
        new mongoose.Types.ObjectId(userId.toString()),
        amount,
        transaction._id as mongoose.Types.ObjectId
    );

    if (!result.success) {
        // Rollback wallet changes
        wallet.availableBalance += amount;
        wallet.locked -= amount;
        await wallet.save();

        throw new Error(result.error || 'Failed to record contribution');
    }

    await group.save();

    // Check if round is complete and trigger payout
    const currentRound = group.rounds[group.currentRound - 1];
    if (currentRound.status === 'completed') {
        await processRoundPayout(group._id as mongoose.Types.ObjectId);
    }

    console.log(`✅ Contribution recorded: ${member.name} → $${amount} (Round ${group.currentRound})`);

    return {
        success: true,
        transaction,
        round: currentRound,
        groupStatus: group.status
    };
}

// ==================== PAYOUTS ====================

/**
 * Process payout for a completed round
 */
export async function processRoundPayout(groupId: string | mongoose.Types.ObjectId) {
    const group = await Group.findById(groupId);
    if (!group) throw new Error('Group not found');

    const currentRound = group.rounds[group.currentRound - 1];
    if (!currentRound) throw new Error('Invalid round');

    if (currentRound.status !== 'completed') {
        throw new Error('Round is not completed');
    }

    // Get recipient
    const recipient = group.members.find(m => m.userId.toString() === currentRound.recipientId.toString());
    if (!recipient) throw new Error('Recipient not found');

    // Get recipient wallet
    const wallet = await Wallet.findOne({ userId: currentRound.recipientId });
    if (!wallet) throw new Error('Recipient wallet not found');

    const payoutAmount = currentRound.collectedAmount;

    // Transfer from escrow to recipient
    wallet.availableBalance += payoutAmount;
    wallet.locked -= payoutAmount; // Unlock from each contributor
    await wallet.save();

    // Update group escrow
    group.escrowBalance -= payoutAmount;
    group.totalPaidOut += payoutAmount;

    // Create payout transaction
    const payoutTransaction = await Transaction.create({
        userId: currentRound.recipientId,
        type: 'credit',
        amount: payoutAmount,
        description: `Group payout - ${group.name} (Round ${group.currentRound})`,
        status: 'completed',
        metadata: {
            groupId: group._id,
            groupName: group.name,
            roundNumber: group.currentRound,
            payoutType: 'group_payout'
        }
    });

    // Update round
    currentRound.payoutTransactionId = payoutTransaction._id as mongoose.Types.ObjectId;
    currentRound.payoutDate = new Date();
    currentRound.completedAt = new Date();

    // Move to next round or complete group
    if (group.currentRound < group.totalRounds) {
        group.currentRound++;
    } else {
        group.status = 'completed';
        group.endDate = new Date();
    }

    await group.save();

    // Notify recipient
    await notifyPayoutReceived(group, currentRound, recipient, payoutAmount);

    // Notify next round if not completed
    if (group.status === 'active') {
        await notifyNextRoundStarted(group);
    }

    console.log(`✅ Payout processed: $${payoutAmount} → ${recipient.name} (Round ${currentRound.roundNumber})`);

    return {
        success: true,
        payout: payoutAmount,
        recipient: recipient.name,
        transaction: payoutTransaction
    };
}

/**
 * Notify recipient of payout
 */
async function notifyPayoutReceived(
    group: IGroup,
    round: any,
    recipient: any,
    amount: number
) {
    try {
        await sendEmail(
            recipient.email,
            `💰 You received $${amount} from "${group.name}"!`,
            `
Hi ${recipient.name},

Congratulations! You have received your payout from "${group.name}".

Payout Details:
- Amount: $${amount}
- Round: ${round.roundNumber} of ${group.totalRounds}
- Date: ${new Date().toLocaleDateString()}

The funds have been added to your wallet.

View Transaction: ${process.env.FRONTEND_URL}/wallet-transactions

Save2740 Team
            `.trim()
        );
    } catch (error) {
        console.error(`Failed to send payout notification to ${recipient.email}:`, error);
    }
}

/**
 * Notify members that next round has started
 */
async function notifyNextRoundStarted(group: IGroup) {
    const nextRound = group.rounds[group.currentRound - 1];
    if (!nextRound) return;

    for (const member of group.members) {
        if (member.status !== 'active') continue;

        try {
            await sendEmail(
                member.email,
                `🔔 Round ${group.currentRound} of "${group.name}" has started`,
                `
Hi ${member.name},

A new round has started for "${group.name}".

Round ${group.currentRound} Details:
- Due Date: ${nextRound.dueDate.toLocaleDateString()}
- Your Contribution: $${group.contributionAmount}
- Recipient: ${nextRound.recipientName}

Make your contribution by ${nextRound.dueDate.toLocaleDateString()} to avoid penalties.

Contribute Now: ${process.env.FRONTEND_URL}/groups/${group._id}

Save2740 Team
                `.trim()
            );
        } catch (error) {
            console.error(`Failed to send next round notification to ${member.email}:`, error);
        }
    }
}

// ==================== CHAIN BREAK HANDLING ====================

/**
 * Check for missed contributions and handle chain breaks
 */
export async function checkForChainBreaks(groupId: string | mongoose.Types.ObjectId) {
    const group = await Group.findById(groupId);
    if (!group || group.status !== 'active') return;

    const currentRound = group.rounds[group.currentRound - 1];
    if (!currentRound) return;

    const now = new Date();
    const graceDeadline = new Date(currentRound.dueDate);
    graceDeadline.setHours(graceDeadline.getHours() + group.gracePeriodHours);

    // Check if grace period has expired
    if (now <= graceDeadline) return;

    // Find members who haven't contributed
    const paidUserIds = currentRound.contributions.map(c => c.userId.toString());
    const missingMembers = group.members.filter(
        m => m.status === 'active' && !paidUserIds.includes(m.userId.toString())
    );

    if (missingMembers.length === 0) return;

    console.log(`⚠️ Chain break detected in group ${group.name}. Missing: ${missingMembers.length} members`);

    for (const member of missingMembers) {
        await handleChainBreak(group, member, currentRound.roundNumber);
    }

    await group.save();
}

/**
 * Handle a single member's chain break
 */
async function handleChainBreak(group: IGroup, member: any, roundNumber: number) {
    // Mark member as chain_broken
    member.status = 'chain_broken';
    member.missedContributions++;

    // Calculate forfeited amount (all previous contributions)
    const forfeitedAmount = member.totalContributed;

    // Record chain break
    group.chainBreaks.push({
        userId: member.userId,
        userName: member.name,
        roundNumber,
        forfeitedAmount,
        date: new Date()
    });

    // Distribute forfeited funds among remaining active members
    const activeMembers = group.members.filter(m => m.status === 'active');
    if (activeMembers.length > 0 && forfeitedAmount > 0) {
        const sharePerMember = forfeitedAmount / activeMembers.length;

        for (const activeMember of activeMembers) {
            const wallet = await Wallet.findOne({ userId: activeMember.userId });
            if (wallet) {
                wallet.availableBalance += sharePerMember;
                await wallet.save();

                // Create compensation transaction
                await Transaction.create({
                    userId: activeMember.userId,
                    type: 'credit',
                    amount: sharePerMember,
                    description: `Chain break compensation - ${group.name}`,
                    status: 'completed',
                    metadata: {
                        groupId: group._id,
                        groupName: group.name,
                        reason: 'chain_break_compensation',
                        brokenBy: member.userId
                    }
                });
            }
        }
    }

    // Notify member of chain break
    try {
        await sendEmail(
            member.email,
            `❌ Chain Broken - "${group.name}"`,
            `
Hi ${member.name},

Unfortunately, you have broken the chain in "${group.name}" by missing the contribution deadline for Round ${roundNumber}.

Consequences:
- Your ${member.totalContributed > 0 ? `$${forfeitedAmount} in prior contributions have been forfeited` : 'membership has been revoked'}
- You have been removed from the group
- You are restricted from joining new groups for ${group.chainBreakPenaltyDays} days

This penalty is enforced to maintain trust and accountability within the group.

If you believe this is an error, please contact support immediately.

Save2740 Team
            `.trim()
        );
    } catch (error) {
        console.error(`Failed to send chain break notification to ${member.email}:`, error);
    }

    // Notify remaining members
    // Notify remaining members
    // activeMembers is already defined above, but filtering again to be safe
    const remainingMembers = group.members.filter(m => m.status === 'active');
    for (const activeMember of remainingMembers) {
        try {
            await sendEmail(
                activeMember.email,
                `⚠️ Chain Break in "${group.name}"`,
                `
Hi ${activeMember.name},

A member (${member.name}) has broken the chain in "${group.name}" by missing the Round ${roundNumber} contribution deadline.

Impact:
- The member has been removed from the group
- Their forfeited contributions ($${forfeitedAmount}) have been distributed among remaining members
- You received: $${forfeitedAmount / activeMembers.length}

The group will ${activeMembers.length >= 2 ? 'continue with remaining members' : 'be dissolved due to insufficient members'}.

View Group: ${process.env.FRONTEND_URL}/groups/${group._id}

Save2740 Team
                `.trim()
            );
        } catch (error) {
            console.error(`Failed to send chain break notification to ${activeMember.email}:`, error);
        }
    }

    // Check if group should be dissolved
    const remainingActiveMembers = group.members.filter(m => m.status === 'active').length;
    if (remainingActiveMembers < 2) {
        group.status = 'failed';
        group.endDate = new Date();
        console.log(`❌ Group ${group.name} dissolved due to insufficient members after chain break`);
    } else {
        group.status = 'at_risk';
    }

    console.log(`❌ Chain break handled: ${member.name} removed from ${group.name}`);
}

// ==================== CRON JOB HELPERS ====================

/**
 * Check all active groups for due contributions (run daily)
 */
export async function checkAllGroupsForDueContributions() {
    const activeGroups = await Group.find({ status: 'active' });

    console.log(`🔍 Checking ${activeGroups.length} active groups for due contributions...`);

    for (const group of activeGroups) {
        try {
            await checkForChainBreaks(group._id as mongoose.Types.ObjectId);
        } catch (error) {
            console.error(`Error checking group ${group._id}:`, error);
        }
    }

    console.log(`✅ Completed checking all groups`);
}

/**
 * Initialize rounds for locked groups that have reached start date (run daily)
 */
export async function initializeLockedGroups() {
    const now = new Date();
    const lockedGroups = await Group.find({
        status: 'locked',
        autoStartDate: { $lte: now }
    });

    console.log(`🚀 Found ${lockedGroups.length} groups ready to start...`);

    for (const group of lockedGroups) {
        try {
            await initializeGroupRounds(group._id as mongoose.Types.ObjectId);
        } catch (error) {
            console.error(`Error initializing group ${group._id}:`, error);
        }
    }

    console.log(`✅ Initialized ${lockedGroups.length} groups`);
}
