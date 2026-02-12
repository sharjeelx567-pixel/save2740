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
import { getFinancialRolesForUserIds, getFinancialRole, getFinancialRoleLabel, FinancialRole } from '../utils/financial-role';

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
            financialRole: financialRoleFilter,
            dateFrom,
            dateTo,
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

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
            if (dateTo) {
                const d = new Date(dateTo as string);
                d.setHours(23, 59, 59, 999);
                query.createdAt.$lte = d;
            }
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };
        const limitNum = Number(limit);
        const pageNum = Number(page);

        let users: any[];
        let total: number;

        if (financialRoleFilter && ['saver', 'contribution_member', 'saver_and_contribution_member', 'inactive'].includes(financialRoleFilter as string)) {
            const allMatching = await User.find(query).select('-passwordHash').sort(sort).limit(5000).lean();
            const userIds = allMatching.map((u: any) => u._id.toString());
            const roleMap = await getFinancialRolesForUserIds(userIds);
            const filtered = allMatching.filter((u: any) => roleMap[u._id.toString()] === financialRoleFilter);
            total = filtered.length;
            users = filtered.slice(skip, skip + limitNum);
        } else {
            [users, total] = await Promise.all([
                User.find(query).select('-passwordHash').sort(sort).skip(skip).limit(limitNum),
                User.countDocuments(query)
            ]);
        }

        const userIds = users.map((u: any) => u._id.toString());
        const roleMap = await getFinancialRolesForUserIds(userIds);

        const toPlain = (u: any) => (u && typeof u.toObject === 'function' ? u.toObject() : u);

        // Get wallet info and attach financial role for each user
        const usersWithWallets = await Promise.all(
            users.map(async (user) => {
                const uid = (user._id || user.id)?.toString?.() || String(user._id);
                const wallet = await Wallet.findOne({ userId: uid });
                const financialRole: FinancialRole = roleMap[uid] || 'inactive';
                return {
                    ...toPlain(user),
                    financialRole,
                    financialRoleLabel: getFinancialRoleLabel(financialRole),
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
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum) || 1
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
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId?.[0] ?? '';

        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Import models
        const { Transaction } = await import('../models/transaction');
        const { KycDocument } = await import('../models/kyc-document');
        const { SupportTicket } = await import('../models/support-ticket.model');

        const [wallet, activeSessions, recentTransactions, kycDoc, openTickets, financialRole] = await Promise.all([
            Wallet.findOne({ userId }),
            RefreshToken.countDocuments({
                userId,
                revokedAt: null,
                expiresAt: { $gt: new Date() }
            }),
            Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10),
            KycDocument.findOne({ userId }).sort({ createdAt: -1 }),
            SupportTicket.countDocuments({ userId, status: { $in: ['open', 'in-progress'] } }),
            getFinancialRole(userId)
        ]);

        res.json({
            success: true,
            data: {
                user: {
                    ...user.toObject(),
                    financialRole,
                    financialRoleLabel: getFinancialRoleLabel(financialRole),
                },
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

// POST /api/admin/users/:userId/note - Add internal note
router.post('/:userId/note', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({ success: false, error: 'Note is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const { Admin } = await import('../modules/admin/auth/admin.model');
        const admin = await Admin.findById(req.userId);

        user.adminNotes = user.adminNotes || [];
        user.adminNotes.push({
            note,
            adminId: req.userId!,
            adminName: admin?.username || 'Admin',
            createdAt: new Date()
        });

        await user.save();

        res.json({
            success: true,
            message: 'Note added successfully',
            data: user.adminNotes
        });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ success: false, error: 'Failed to add note' });
    }
});

// POST /api/admin/users/:userId/wallet/freeze - Freeze wallet
router.post('/:userId/wallet/freeze', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, error: 'Reason for freeze is required' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ success: false, error: 'Wallet not found' });
        }

        wallet.status = 'frozen';
        wallet.freezeReason = reason;
        wallet.freezeDate = new Date();
        wallet.frozenBy = req.userId;
        await wallet.save();

        // Audit Log
        const { AuditLog } = await import('../models/audit-log');
        await AuditLog.create({
            userId: req.userId,
            action: 'FREEZE_WALLET',
            resourceType: 'wallet',
            resourceId: wallet._id.toString(),
            ipAddress: req.ip,
            severity: 'warning',
            metadata: { userId, reason }
        });

        res.json({
            success: true,
            message: 'Wallet frozen successfully',
            data: wallet
        });
    } catch (error) {
        console.error('Freeze wallet error:', error);
        res.status(500).json({ success: false, error: 'Failed to freeze wallet' });
    }
});

// POST /api/admin/users/:userId/wallet/unfreeze - Unfreeze wallet
router.post('/:userId/wallet/unfreeze', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;
        const { reason } = req.body;

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ success: false, error: 'Wallet not found' });
        }

        wallet.status = 'active';
        wallet.freezeReason = undefined;
        wallet.freezeDate = undefined;
        wallet.frozenBy = undefined;
        await wallet.save();

        // Audit Log
        const { AuditLog } = await import('../models/audit-log');
        await AuditLog.create({
            userId: req.userId,
            action: 'UNFREEZE_WALLET',
            resourceType: 'wallet',
            resourceId: wallet._id.toString(),
            ipAddress: req.ip,
            severity: 'info',
            metadata: { userId, reason }
        });

        res.json({
            success: true,
            message: 'Wallet unfrozen successfully',
            data: wallet
        });
    } catch (error) {
        console.error('Unfreeze wallet error:', error);
        res.status(500).json({ success: false, error: 'Failed to unfreeze wallet' });
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
