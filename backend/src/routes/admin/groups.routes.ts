import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { Group } from '../../models/group.model';
import { User } from '../../models/auth.model';
import { connectDB } from '../../config/db';
import { AuditLog } from '../../models/audit-log';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/admin/groups - List all groups with filters
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const {
            page = 1,
            limit = 50,
            search,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query: any = {};

        // Handle search - filter out 'undefined' string and empty values
        const searchStr = search ? String(search) : '';
        if (searchStr && searchStr !== 'undefined' && searchStr.trim() !== '') {
            query.$or = [
                { name: { $regex: searchStr, $options: 'i' } },
                { joinCode: { $regex: searchStr, $options: 'i' } },
                { creatorEmail: { $regex: searchStr, $options: 'i' } }
            ];
        }

        // Handle status - filter out 'undefined' string and 'all'
        const statusStr = status ? String(status) : '';
        if (statusStr && statusStr !== 'all' && statusStr !== 'undefined') {
            query.status = statusStr;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

        const [groups, total] = await Promise.all([
            Group.find(query)
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            Group.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                groups,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get admin groups error:', error);
        res.status(500).json({ success: false, error: 'Failed to get groups' });
    }
});

// GET /api/admin/groups/:id - Get group details
router.get('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            return res.status(400).json({ success: false, error: 'Invalid group ID' });
        }

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        res.json({
            success: true,
            data: group
        });
    } catch (error) {
        console.error('Get admin group error:', error);
        res.status(500).json({ success: false, error: 'Failed to get group' });
    }
});

// POST /api/admin/groups/:id/freeze - Freeze group
router.post('/:id/freeze', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, error: 'Reason is required' });
        }

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        const oldStatus = group.status;
        group.status = 'frozen';
        await group.save();

        // Audit Log
        await AuditLog.create({
            userId: req.userId,
            action: 'FREEZE_GROUP',
            resourceType: 'group',
            resourceId: id,
            ipAddress: req.ip,
            severity: 'warning',
            changes: [
                { field: 'status', oldValue: oldStatus, newValue: 'frozen' }
            ],
            metadata: { reason }
        });

        res.json({
            success: true,
            message: 'Group frozen successfully',
            data: group
        });
    } catch (error) {
        console.error('Freeze group error:', error);
        res.status(500).json({ success: false, error: 'Failed to freeze group' });
    }
});

// POST /api/admin/groups/:id/unfreeze - Unfreeze group
router.post('/:id/unfreeze', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { targetStatus = 'active', reason } = req.body;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        if (group.status !== 'frozen') {
            return res.status(400).json({ success: false, error: 'Group is not frozen' });
        }

        const oldStatus = group.status;
        group.status = targetStatus;
        await group.save();

        // Audit Log
        await AuditLog.create({
            userId: req.userId,
            action: 'UNFREEZE_GROUP',
            resourceType: 'group',
            resourceId: id,
            ipAddress: req.ip,
            severity: 'info',
            changes: [
                { field: 'status', oldValue: oldStatus, newValue: targetStatus }
            ],
            metadata: { reason }
        });

        res.json({
            success: true,
            message: 'Group unfrozen successfully',
            data: group
        });
    } catch (error) {
        console.error('Unfreeze group error:', error);
        res.status(500).json({ success: false, error: 'Failed to unfreeze group' });
    }
});

// DELETE /api/admin/groups/:id/member/:userId - Remove member
router.delete('/:id/member/:userId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { id, userId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, error: 'Reason is required' });
        }

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        const memberIndex = group.members.findIndex(m => m.userId.toString() === userId);
        if (memberIndex === -1) {
            return res.status(404).json({ success: false, error: 'Member not found in group' });
        }

        const member = group.members[memberIndex];
        member.status = 'removed';
        group.currentMembers -= 1;

        // If group was locked/active, we might need to handle the payout reshuffle logic
        // For now, just mark as removed

        await group.save();

        // Audit Log
        await AuditLog.create({
            userId: req.userId,
            action: 'REMOVE_GROUP_MEMBER',
            resourceType: 'group',
            resourceId: id,
            ipAddress: req.ip,
            severity: 'warning',
            metadata: { userId, memberName: member.name, reason }
        });

        res.json({
            success: true,
            message: 'Member removed successfully',
            data: group
        });
    } catch (error) {
        console.error('Remove group member error:', error);
        res.status(500).json({ success: false, error: 'Failed to remove group member' });
    }
});

// POST /api/admin/groups/:id/payout - Manually trigger current round payout
router.post('/:id/payout', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { id } = req.params;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Validate group has rounds
        if (!group.rounds || group.rounds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Group has no rounds initialized. Group must be active to trigger payouts.'
            });
        }

        // Validate current round
        if (!group.currentRound || group.currentRound < 1) {
            return res.status(400).json({
                success: false,
                error: 'Group has no active round. Current round: ' + (group.currentRound || 0)
            });
        }

        const currentRound = group.rounds[group.currentRound - 1];
        if (!currentRound) {
            return res.status(400).json({
                success: false,
                error: `Round ${group.currentRound} not found. Total rounds: ${group.rounds.length}`
            });
        }

        // Check if round is ready for payout
        if (currentRound.status !== 'completed' && req.body.force !== true) {
            return res.status(400).json({
                success: false,
                error: 'Round is not fully funded. Use { "force": true } to payout partial amount.',
                details: {
                    roundStatus: currentRound.status,
                    roundNumber: group.currentRound,
                    totalRounds: group.rounds.length
                }
            });
        }

        const { processRoundPayout } = await import('../../services/group-contribution.service');
        const result = await processRoundPayout(id as string);

        // Audit Log
        await AuditLog.create({
            userId: req.userId,
            action: 'MANUAL_PAYOUT',
            resourceType: 'group',
            resourceId: id,
            ipAddress: req.ip,
            severity: 'warning',
            metadata: { roundNumber: group.currentRound, amount: result.payout }
        });

        res.json({ success: true, message: 'Payout triggered successfully', data: result });
    } catch (error: any) {
        console.error('Manual payout error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to trigger payout' });
    }
});

// POST /api/admin/groups/:id/member/:userId/reinstate - Reinstate a removed member
router.post('/:id/member/:userId/reinstate', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { id, userId } = req.params;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        const member = group.members.find(m => m.userId.toString() === userId);
        if (!member) return res.status(404).json({ success: false, error: 'Member not found' });

        member.status = 'active';
        group.currentMembers += 1;
        await group.save();

        // Audit Log
        await AuditLog.create({
            userId: req.userId,
            action: 'REINSTATE_MEMBER',
            resourceType: 'group',
            resourceId: id,
            ipAddress: req.ip,
            severity: 'info',
            metadata: { userId, memberName: member.name }
        });

        res.json({ success: true, message: 'Member reinstated successfully', data: group });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to reinstate member' });
    }
});

export default router;
