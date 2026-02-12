/**
 * Admin Groups Routes
 * 
 * Admin endpoints for managing and viewing all groups
 */

import express, { Response } from 'express';
import { Group, IGroup, IGroupMember } from '../../../models/group.model';
import { User } from '../../../models/auth.model';
import { authenticateAdmin, AuthRequest } from '../../../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/admin/groups
 * List all groups with filters and pagination
 */
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query: any = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search by name or join code
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { joinCode: { $regex: search, $options: 'i' } },
                { creatorEmail: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sortOptions: any = {};
        sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

        const [groups, total] = await Promise.all([
            Group.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Group.countDocuments(query)
        ]);

        // Calculate stats
        const stats = await Group.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusCounts = stats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        // Calculate active rounds
        const activeRounds = await Group.countDocuments({
            status: 'active',
            currentRound: { $gt: 0 }
        });

        res.json({
            success: true,
            data: {
                groups,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalItems: total,
                    itemsPerPage: Number(limit)
                },
                stats: {
                    total,
                    ...statusCounts,
                    activeRounds
                }
            }
        });
    } catch (error) {
        console.error('Admin get groups error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch groups'
        });
    }
});

/**
 * GET /api/admin/groups/:id
 * Get detailed group information
 */
router.get('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id).lean();

        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        // Get member details
        const memberIds = group.members.map((m: any) => m.userId);
        const members = await User.find({
            _id: { $in: memberIds }
        }).select('_id email firstName lastName profileImage').lean();

        const membersMap = members.reduce((acc: any, user: any) => {
            acc[user._id.toString()] = user;
            return acc;
        }, {});

        const enrichedMembers = group.members.map((member: any) => ({
            ...member,
            userDetails: membersMap[member.userId.toString()] || null
        }));

        res.json({
            success: true,
            data: {
                ...group,
                members: enrichedMembers
            }
        });
    } catch (error) {
        console.error('Admin get group error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch group details'
        });
    }
});

/**
 * POST /api/admin/groups/:id/freeze
 * Freeze a group (pause contributions)
 */
router.post('/:id/freeze', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        group.status = 'frozen';
        group.contributionsPaused = true;
        group.pausedReason = reason;
        group.pausedBy = req.userId;
        group.pausedAt = new Date();

        await group.save();

        res.json({
            success: true,
            message: 'Group frozen successfully',
            data: group
        });
    } catch (error) {
        console.error('Admin freeze group error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to freeze group'
        });
    }
});

/**
 * POST /api/admin/groups/:id/unfreeze
 * Unfreeze a group (resume contributions)
 */
router.post('/:id/unfreeze', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason, targetStatus = 'active' } = req.body;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        group.status = targetStatus as any;
        group.contributionsPaused = false;
        group.pausedReason = undefined;
        group.pausedBy = undefined;
        group.pausedAt = undefined;

        await group.save();

        res.json({
            success: true,
            message: 'Group unfrozen successfully',
            data: group
        });
    } catch (error) {
        console.error('Admin unfreeze group error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unfreeze group'
        });
    }
});

/**
 * DELETE /api/admin/groups/:groupId/member/:userId
 * Remove a member from a group
 */
router.delete('/:groupId/member/:userId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { groupId, userId } = req.params;
        const { reason } = req.body;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        const memberIndex = group.members.findIndex(
            (m: IGroupMember) => m.userId.toString() === userId
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Member not found in group'
            });
        }

        // Update member status  
        group.members[memberIndex].status = 'removed';
        group.currentMembers -= 1;

        await group.save();

        res.json({
            success: true,
            message: 'Member removed successfully',
            data: group
        });
    } catch (error) {
        console.error('Admin remove member error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove member'
        });
    }
});

/**
 * POST /api/admin/groups/:groupId/member/:userId/reinstate
 * Reinstate a removed member
 */
router.post('/:groupId/member/:userId/reinstate', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { groupId, userId } = req.params;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        const member = group.members.find(
            (m: IGroupMember) => m.userId.toString() === userId
        );

        if (!member) {
            return res.status(404).json({
                success: false,
                error: 'Member not found in group'
            });
        }

        if (member.status !== 'removed') {
            return res.status(400).json({
                success: false,
                error: 'Member is not removed'
            });
        }

        member.status = 'active';
        group.currentMembers += 1;

        await group.save();

        res.json({
            success: true,
            message: 'Member reinstated successfully',
            data: group
        });
    } catch (error) {
        console.error('Admin reinstate member error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reinstate member'
        });
    }
});

/**
 * POST /api/admin/groups/:id/payout
 * Trigger manual payout for a round
 */
router.post('/:id/payout', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { force = false } = req.body;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        if (group.currentRound < 1 || group.currentRound > group.totalRounds) {
            return res.status(400).json({
                success: false,
                error: 'No active round'
            });
        }

        const currentRound = group.rounds[group.currentRound - 1];

        if (!force && currentRound.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Round already completed'
            });
        }

        // This would normally trigger the actual payout logic
        // For now, just mark as completed

        currentRound.status = 'completed';
        currentRound.completedAt = new Date();

        // Advance to next round
        if (group.currentRound < group.totalRounds) {
            group.currentRound += 1;
        } else {
            group.status = 'completed';
        }

        await group.save();

        res.json({
            success: true,
            message: 'Payout triggered successfully',
            data: group
        });
    } catch (error) {
        console.error('Admin trigger payout error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger payout'
        });
    }
});

export default router;
