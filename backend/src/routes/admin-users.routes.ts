/**
 * Admin User Management Routes
 * Comprehensive user control and monitoring
 */

import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { User } from '../models/auth.model';
import { Wallet } from '../models/wallet.model';
import { RefreshToken } from '../models/refresh-token.model';
import { connectDB } from '../config/db';

const router = express.Router();

// GET /api/admin/users - List all users with filters
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { 
            page = 1, 
            limit = 50, 
            search, 
            status, 
            kycStatus,
            accountTier,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query: any = {};
        
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) query.accountStatus = status;
        if (kycStatus) query.kycStatus = kycStatus;
        if (accountTier) query.accountTier = accountTier;

        const skip = (Number(page) - 1) * Number(limit);
        const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-passwordHash')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments(query)
        ]);

        // Get wallet info for each user
        const usersWithWallets = await Promise.all(
            users.map(async (user) => {
                const wallet = await Wallet.findOne({ userId: user._id.toString() });
                return {
                    ...user.toObject(),
                    wallet: wallet ? {
                        balance: wallet.balance,
                        availableBalance: wallet.availableBalance,
                        locked: wallet.locked
                    } : null
                };
            })
        );

        res.json({
            success: true,
            data: {
                users: usersWithWallets,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to get users' });
    }
});

// GET /api/admin/users/:userId - Get single user details
router.get('/:userId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;

        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Import models
        const { Transaction } = await import('../models/transaction');
        const { KycDocument } = await import('../models/kyc-document');
        const { SupportTicket } = await import('../models/support-ticket.model');

        const [wallet, activeSessions, recentTransactions, kycDoc, openTickets] = await Promise.all([
            Wallet.findOne({ userId }),
            RefreshToken.countDocuments({ 
                userId, 
                revokedAt: null, 
                expiresAt: { $gt: new Date() } 
            }),
            Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10),
            KycDocument.findOne({ userId }).sort({ createdAt: -1 }),
            SupportTicket.countDocuments({ userId, status: { $in: ['open', 'in-progress'] } })
        ]);

        res.json({
            success: true,
            data: {
                user: user.toObject(),
                wallet,
                activeSessions,
                recentTransactions,
                kyc: kycDoc,
                openTickets
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, error: 'Failed to get user' });
    }
});

// POST /api/admin/users/lock - Lock user account
router.post('/lock', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId, reason } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.accountStatus = 'locked';
        await user.save();

        // Revoke all active sessions
        await RefreshToken.updateMany(
            { userId, revokedAt: null },
            { revokedAt: new Date(), revokedByIp: 'admin' }
        );

        res.json({
            success: true,
            message: 'User locked successfully',
            data: { userId, accountStatus: 'locked', reason }
        });
    } catch (error) {
        console.error('Lock user error:', error);
        res.status(500).json({ success: false, error: 'Failed to lock user' });
    }
});

// POST /api/admin/users/unlock - Unlock user account
router.post('/unlock', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.accountStatus = 'active';
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'User unlocked successfully',
            data: { userId, accountStatus: 'active' }
        });
    } catch (error) {
        console.error('Unlock user error:', error);
        res.status(500).json({ success: false, error: 'Failed to unlock user' });
    }
});

// POST /api/admin/users/suspend - Suspend user account
router.post('/suspend', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId, reason } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.accountStatus = 'suspended';
        await user.save();

        // Revoke all active sessions
        await RefreshToken.updateMany(
            { userId, revokedAt: null },
            { revokedAt: new Date(), revokedByIp: 'admin' }
        );

        res.json({
            success: true,
            message: 'User suspended successfully',
            data: { userId, accountStatus: 'suspended', reason }
        });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ success: false, error: 'Failed to suspend user' });
    }
});

// POST /api/admin/users/force-logout - Force logout user
router.post('/force-logout', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        // Revoke all active sessions
        const result = await RefreshToken.updateMany(
            { userId, revokedAt: null },
            { revokedAt: new Date(), revokedByIp: 'admin' }
        );

        res.json({
            success: true,
            message: 'User logged out successfully',
            data: { userId, sessionsRevoked: result.modifiedCount }
        });
    } catch (error) {
        console.error('Force logout error:', error);
        res.status(500).json({ success: false, error: 'Failed to force logout' });
    }
});

// POST /api/admin/users/reset-verification - Reset email/phone verification
router.post('/reset-verification', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId, type } = req.body; // type: 'email' | 'phone'

        if (!userId || !type) {
            return res.status(400).json({ success: false, error: 'userId and type are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (type === 'email') {
            user.emailVerified = false;
        }

        await user.save();

        res.json({
            success: true,
            message: `${type} verification reset successfully`,
            data: { userId, type }
        });
    } catch (error) {
        console.error('Reset verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to reset verification' });
    }
});

// GET /api/admin/users/stats - Get user statistics
router.get('/stats/overview', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const [
            total,
            active,
            suspended,
            locked,
            kycPending,
            kycApproved,
            today
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ accountStatus: 'active' }),
            User.countDocuments({ accountStatus: 'suspended' }),
            User.countDocuments({ accountStatus: 'locked' }),
            User.countDocuments({ kycStatus: 'pending' }),
            User.countDocuments({ kycStatus: 'approved' }),
            User.countDocuments({ 
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } 
            })
        ]);

        res.json({
            success: true,
            data: {
                total,
                active,
                suspended,
                locked,
                kycPending,
                kycApproved,
                newToday: today
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
});

export default router;
