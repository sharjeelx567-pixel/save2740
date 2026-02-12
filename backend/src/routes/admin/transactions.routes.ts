import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { Transaction } from '../../models/transaction.model';
import { User } from '../../models/auth.model';
import { connectDB } from '../../config/db';

const router = express.Router();

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all transactions with filtering and pagination
 * @access  Admin
 */
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { page = 1, limit = 50, search, type, status, dateFrom, dateTo, amountMin, amountMax } = req.query;

        const query: any = {};

        // Search by user email or name or transaction ID
        if (search) {
            const searchRegex = new RegExp(search as string, 'i');

            // First find users matching the search
            const users = await User.find({
                $or: [
                    { email: searchRegex },
                    { firstName: searchRegex },
                    { lastName: searchRegex }
                ]
            }).select('_id');

            const userIds = users.map(u => u._id);

            query.$or = [
                { userId: { $in: userIds } },
                { transactionId: searchRegex },
                { description: searchRegex }
            ];
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
            if (dateTo) {
                const d = new Date(dateTo as string);
                d.setHours(23, 59, 59, 999);
                query.createdAt.$lte = d;
            }
        }

        if (amountMin != null && amountMin !== '') {
            const n = Number(amountMin);
            if (!isNaN(n)) {
                query.amount = query.amount || {};
                query.amount.$gte = n;
            }
        }
        if (amountMax != null && amountMax !== '') {
            const n = Number(amountMax);
            if (!isNaN(n)) {
                query.amount = query.amount || {};
                query.amount.$lte = n;
            }
        }

        const skip = (Number(page) - 1) * Number(limit);

        const transactions = await Transaction.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Transaction.countDocuments(query);

        // Format transactions for frontend
        const formattedTransactions = transactions.map(tx => {
            const user = tx.userId as any; // Type assertion since specific fields selected
            return {
                id: tx.transactionId || tx._id, // Prefer transactionId
                userId: user?._id || tx.userId,
                user: user ? {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                } : { firstName: 'Unknown', lastName: 'User', email: 'unknown' },
                type: tx.type,
                amount: tx.amount,
                status: tx.status,
                description: tx.description,
                createdAt: tx.createdAt,
                completedAt: tx.status === 'completed' ? tx.updatedAt : undefined
            };
        });

        res.json({
            success: true,
            data: {
                transactions: formattedTransactions,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get admin transactions error:', error);
        res.status(500).json({ success: false, error: 'Failed to get transactions' });
    }
});

/**
 * @route   GET /api/admin/transactions/export
 * @desc    Export transactions (placeholder)
 * @access  Admin
 */
/**
 * @route   GET /api/admin/transactions/stats
 * @desc    Get transaction statistics (volume, counts)
 * @access  Admin
 */
router.get('/stats', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // Volume (24h)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const volumeStats = await Transaction.aggregate([
            { $match: { createdAt: { $gte: yesterday }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Counts
        const counts = await Transaction.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const stats = {
            totalVolume: volumeStats[0]?.total || 0,
            completed: counts.find(c => c._id === 'completed')?.count || 0,
            pending: counts.find(c => c._id === 'pending')?.count || 0,
            failed: counts.find(c => c._id === 'failed')?.count || 0
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get transaction stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
});

/**
 * @route   GET /api/admin/transactions/export
 * @desc    Export transactions (placeholder)
 * @access  Admin
 */
router.get('/export', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    // Ideally use a CSV generation library here
    try {
        await connectDB();
        // Just return a success status for now as actual file download logic is complex
        // and usually handled by generating a file and returning a URL or stream
        res.json({ success: true, message: "Export functionality not fully implemented but endpoint exists." });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Export failed' });
    }
});

export default router;
