import express, { Response } from 'express';
import { Group } from '../models/group.model';
import { User } from '../models/auth.model';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/groups - List user's groups
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Find groups where user is a member
    const groups = await Group.find({
      'members.userId': req.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('List groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list groups'
    });
  }
});

// POST /api/groups - Create a new group
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const {
      name,
      purpose,
      contributionAmount,
      frequency,
      minMembers,
      maxMembers,
      startDate,
      payoutOrderRule
    } = req.body;

    if (!name || !contributionAmount) {
      return res.status(400).json({
        success: false,
        error: 'Name and contribution amount are required'
      });
    }

    // Smart Group Size Validation
    // 2-5 users → personal, high accountability
    // 6-10 users → best balance (recommended) ⭐
    // 11-20 users → community feel, still manageable
    // >20 users → NOT recommended (low engagement, chaos)
    const HARD_MIN = 2;
    const HARD_MAX = 20;
    const DEFAULT_MIN = 2;
    const DEFAULT_MAX = 10;

    const validatedMinMembers = Math.max(HARD_MIN, Math.min(minMembers || DEFAULT_MIN, 10));
    const validatedMaxMembers = Math.max(validatedMinMembers, Math.min(maxMembers || DEFAULT_MAX, HARD_MAX));

    // Warn if group is too large
    let sizeWarning = null;
    if (validatedMaxMembers > 10 && validatedMaxMembers <= 20) {
      sizeWarning = 'Groups with 11-20 members can work but may have lower engagement. Consider 6-10 members for best results.';
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate invite code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create new group
    const group = new Group({
      name,
      purpose: purpose || `${name} Savings Group`,
      contributionAmount,
      frequency: frequency || 'monthly',
      minMembers: validatedMinMembers,
      maxMembers: validatedMaxMembers,
      payoutOrderRule: payoutOrderRule || 'as-joined',
      startDate: startDate || new Date(),
      status: 'open',
      joinCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${joinCode}`,

      creatorId: user._id,
      creatorEmail: user.email,

      currentMembers: 1,
      members: [{
        userId: user._id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        joinedAt: new Date(),
        totalContributed: 0,
        payoutPosition: 1,
        status: 'active',
        missedContributions: 0
      }]
    });

    await group.save();

    res.status(201).json({
      success: true,
      data: group,
      sizeWarning
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create group'
    });
  }
});

// GET /api/groups/:id - Get group details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is member
    const isMember = group.members.some(
      (m: any) => m.userId.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Not a member of this group'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group'
    });
  }
});

// POST /api/groups/join - Join a group via code
router.post('/join', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { joinCode } = req.body;
    console.log(`[DEBUG] Join Request - Body:`, req.body);
    console.log(`[DEBUG] Searching for JoinCode: '${joinCode}'`);

    if (!joinCode) {
      return res.status(400).json({
        success: false,
        error: 'Join code is required'
      });
    }

    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });

    if (group) {
      console.log(`[DEBUG] Found group: ${group.name} (${group._id})`);
    } else {
      console.log(`[DEBUG] Group not found for code: ${joinCode.toUpperCase()}`);

      // Debug: List all available codes to see what's in DB
      const allGroups = await Group.find({}, 'joinCode');
      console.log(`[DEBUG] Available Codes: ${allGroups.map(g => g.joinCode).join(', ')}`);
    }

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Invalid join code'
      });
    }

    // Check if already a member
    const isMember = group.members.some(
      (m: any) => m.userId.toString() === req.userId
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this group'
      });
    }

    // Check if group is locked (no new members allowed)
    if (group.status === 'locked' || group.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'This group is locked and no longer accepting new members.'
      });
    }

    // Check capacity with smart limits
    const maxLimit = Math.min(group.maxMembers || 10, 20); // Hard cap at 20
    if (group.members.length >= maxLimit) {
      return res.status(400).json({
        success: false,
        error: 'This group is full. Please join another group or create a new one.',
        details: {
          currentMembers: group.members.length,
          maxMembers: maxLimit,
          suggestion: group.members.length >= 20 
            ? 'Consider creating a new group for better engagement.'
            : 'Try joining a different group or start your own.'
        }
      });
    }

    // Get user details
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add member
    group.members.push({
      userId: user._id,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      joinedAt: new Date(),
      totalContributed: 0,
      payoutPosition: group.members.length + 1,
      status: 'active',
      missedContributions: 0
    });

    group.currentMembers = group.members.length;

    if (group.currentMembers >= group.maxMembers) {
      group.status = 'locked';
      group.filledDate = new Date();

      // Auto-lock the group
      const { lockGroupIfFull } = await import('../services/group-contribution.service');
      await group.save(); // Save first to ensure all members are in DB
      await lockGroupIfFull(group._id as mongoose.Types.ObjectId);

      // Reload to get updated locked status
      const updatedGroup = await Group.findById(group._id);
      if (updatedGroup) {
        return res.json({ success: true, data: updatedGroup });
      }
    }

    await group.save();

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join group'
    });
  }
});

// POST /api/groups/leave - Leave a group
router.post('/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    // Validate groupId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m.userId.toString() === req.userId);

    if (!isMember) {
      return res.status(400).json({
        success: false,
        error: 'You are not a member of this group'
      });
    }

    // Remove the user from members
    group.members = group.members.filter(m => m.userId.toString() !== req.userId);
    group.currentMembers = group.members.length;

    // If group is now empty, mark as completed
    if (group.members.length === 0) {
      group.status = 'completed';
    }

    await group.save();

    res.json({
      success: true,
      message: 'Successfully left group',
      data: {
        groupId: group._id,
        remainingMembers: group.members.length
      }
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave group',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// POST /api/groups/:id/contribute - Contribute to a group
router.post('/:id/contribute', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID format'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // Use the new group contribution service
    const { processGroupContribution } = await import('../services/group-contribution.service');

    const result = await processGroupContribution(groupId, req.userId!, amount);

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Group contribution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process contribution'
    });
  }
});

// GET /api/groups/:id/transactions - Get group transactions
router.get('/:id/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m.userId.toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this group'
      });
    }

    // Get all transactions for this group
    const transactions = await Transaction.find({
      'metadata.groupId': groupId
    }).sort({ createdAt: -1 });

    // Populate with member names
    const enrichedTransactions = await Promise.all(
      transactions.map(async (txn) => {
        const user = await User.findById(txn.userId);
        return {
          id: txn._id,
          memberId: txn.userId,
          memberName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          amount: txn.amount,
          date: txn.createdAt.toISOString(),
          description: txn.description,
          status: txn.status
        };
      })
    );

    res.json({
      success: true,
      data: enrichedTransactions
    });

  } catch (error) {
    console.error('Get group transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// POST /api/groups/:id/join - Alternative join route
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { referralCode, referredBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Verify referral code if provided
    if (referralCode && group.joinCode !== referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    // Check if already a member
    const isMember = group.members.some(m => m.userId.toString() === req.userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this group'
      });
    }

    // Check if group is full
    if (group.currentMembers >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        error: 'Group is full'
      });
    }

    // Get user details for the member
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add member
    group.members.push({
      userId: new mongoose.Types.ObjectId(req.userId),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      joinedAt: new Date(),
      totalContributed: 0,
      payoutPosition: group.currentMembers + 1,
      status: 'active',
      missedContributions: 0
    });

    group.currentMembers += 1;

    if (group.currentMembers >= group.maxMembers) {
      group.status = 'locked';
      group.filledDate = new Date();
    }

    await group.save();

    res.json({
      success: true,
      data: {
        groupId: group._id,
        groupName: group.name,
        yourPosition: group.currentMembers,
        contributionAmount: group.contributionAmount,
        frequency: group.frequency
      }
    });

  } catch (error) {
    console.error('Join group (alt) error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join group'
    });
  }
});

// POST /api/groups/:id/lock - Lock group to prevent new members (admin only)
router.post('/:id/lock', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Only creator (admin) can lock the group
    if (group.creatorId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the group admin can lock this group'
      });
    }

    // Check if already locked
    if (group.status === 'locked' || group.status === 'active') {
      return res.status(400).json({
        success: false,
        error: `Group is already ${group.status}`
      });
    }

    // Lock the group
    group.status = 'locked';
    group.lockedDate = new Date();
    group.totalRounds = group.members.length;

    await group.save();

    res.json({
      success: true,
      message: 'Group locked successfully. No new members can join.',
      data: group
    });

  } catch (error) {
    console.error('Lock group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock group'
    });
  }
});

// POST /api/groups/:id/leave - Alternative leave route
router.post('/:id/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID format'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const isMember = group.members.some(m => m.userId.toString() === req.userId);
    if (!isMember) {
      return res.status(400).json({
        success: false,
        error: 'You are not a member of this group'
      });
    }

    group.members = group.members.filter(m => m.userId.toString() !== req.userId);
    group.currentMembers = group.members.length;

    if (group.members.length === 0) {
      group.status = 'completed';
    }

    await group.save();

    res.json({
      success: true,
      message: 'Successfully left group',
      data: {
        groupId: group._id,
        remainingMembers: group.members.length
      }
    });

  } catch (error) {
    console.error('Leave group (alt) error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave group'
    });
  }
});

// ==================== ROUND MANAGEMENT ====================

// GET /api/groups/:id/rounds - Get all rounds for a group
router.get('/:id/rounds', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, error: 'Invalid group ID format' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const isMember = group.members.some(m => m.userId.toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'You are not a member of this group' });
    }

    res.json({
      success: true,
      data: { currentRound: group.currentRound, totalRounds: group.totalRounds, rounds: group.rounds }
    });
  } catch (error) {
    console.error('Get rounds error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rounds' });
  }
});

// GET /api/groups/:id/ledger - Get group ledger
router.get('/:id/ledger', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, error: 'Invalid group ID format' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const isMember = group.members.some(m => m.userId.toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Not a group member' });
    }

    const ledger = group.rounds.map(round => ({
      roundNumber: round.roundNumber,
      dueDate: round.dueDate,
      recipient: round.recipientName,
      expectedAmount: round.expectedAmount,
      collectedAmount: round.collectedAmount,
      status: round.status,
      contributions: round.contributions.length,
      payoutDate: round.payoutDate
    }));

    res.json({
      success: true,
      data: {
        groupName: group.name,
        status: group.status,
        currentRound: group.currentRound,
        escrowBalance: group.escrowBalance,
        totalPaidOut: group.totalPaidOut,
        chainBreaks: group.chainBreaks.length,
        ledger
      }
    });
  } catch (error) {
    console.error('Get ledger error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ledger' });
  }
});

// POST /api/groups/:id/start - Manually start a group
router.post('/:id/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const groupId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, error: 'Invalid group ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    if (group.creatorId.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only creator can start group' });
    }

    if (group.status !== 'locked') {
      return res.status(400).json({ success: false, error: 'Group must be locked first' });
    }

    const { initializeGroupRounds } = await import('../services/group-contribution.service');
    const updated = await initializeGroupRounds(groupId);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Start group error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
