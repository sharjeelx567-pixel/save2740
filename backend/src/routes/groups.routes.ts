import express, { Response } from 'express';
import { Group } from '../models/group.model';
import { User } from '../models/auth.model';
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
      maxMembers: maxMembers || 10,
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
        payoutPosition: 1
      }]
    });

    await group.save();

    res.status(201).json({
      success: true,
      data: group
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

    const { joinCode } = req.body; // Changed from inviteCode

    if (!joinCode) {
      return res.status(400).json({
        success: false,
        error: 'Join code is required'
      });
    }

    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });

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

    // Check capacity
    if (group.members.length >= (group.maxMembers || 10)) {
      return res.status(400).json({
        success: false,
        error: 'Group is full'
      });
    }

    // Get user details
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add member
    group.members.push({
      userId: user._id, // Mongoose handles casting automatically for document updates
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      joinedAt: new Date(),
      totalContributed: 0,
      payoutPosition: group.members.length + 1
    });

    group.currentMembers = group.members.length;

    if (group.currentMembers >= group.maxMembers) {
      group.status = 'filled';
      group.filledDate = new Date();
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
      return res.status(400).json({ success: false, error: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Filter out the user
    const initialCount = group.members.length;
    group.members = group.members.filter(m => m.userId.toString() !== req.userId);

    if (group.members.length === initialCount) {
      return res.status(400).json({ success: false, error: 'You are not a member of this group' });
    }

    group.currentMembers = group.members.length;

    // If empty, maybe delete? For now just save.

    await group.save();

    res.json({ success: true, message: 'Successfully left group' });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ success: false, error: 'Failed to leave group' });
  }
});

export default router;
