import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { Transaction } from '../../models/transaction.model';
import { User } from '../../models/auth.model';
import { Group } from '../../models/group.model';
import { connectDB } from '../../config/db';

const router = express.Router();

// GET /api/admin/reports/summary - Global summary stats
router.get('/summary', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const [
            totalUsers,
            activeGroups,
            totalTransactions,
            totalVolume
        ] = await Promise.all([
            User.countDocuments(),
            Group.countDocuments({ status: { $in: ['open', 'active'] } }),
            Transaction.countDocuments(),
            Transaction.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                users: totalUsers,
                groups: activeGroups,
                transactions: totalTransactions,
                volume: totalVolume[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate summary' });
    }
});

// GET /api/admin/reports/revenue - Revenue and Volume over time
router.get('/revenue', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { timeframe = '30d' } = req.query;

        const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const data = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate revenue report' });
    }
});

// GET /api/admin/reports/health - Platform health metrics
router.get('/health', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const [
            pendingKyc,
            failedTransactions,
            frozenWallets
        ] = await Promise.all([
            User.countDocuments({ kycStatus: 'pending' }), // Adjusted to match User model
            Transaction.countDocuments({ status: 'failed', createdAt: { $gte: new Date(Date.now() - 24 * 3600000) } }),
            // Wallet status check
            import('../../models/wallet.model').then(m => m.Wallet.countDocuments({ status: 'frozen' }))
        ]);

        res.json({
            success: true,
            data: {
                pendingKyc,
                failedTransactions24h: failedTransactions,
                frozenWallets
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate health report' });
    }
});

// GET /api/admin/reports/export/transactions
router.get('/export/transactions', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { startDate, endDate, status } = req.query;

        const query: any = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const transactions = await Transaction.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();

        // Convert to CSV
        const header = 'ID,Date,User Name,User Email,Type,Amount,Status,Description\n';
        const rows = transactions.map((t: any) => {
            const date = new Date(t.createdAt).toISOString();
            const userName = t.userId ? `"${t.userId.firstName} ${t.userId.lastName}"` : 'Unknown';
            const userEmail = t.userId?.email || 'unknown';
            const cleanDesc = t.description?.replace(/,/g, ' ') || '';
            const amount = t.amount?.toString() || '0';

            return `${t.transactionId || t._id},${date},${userName},${userEmail},${t.type},${amount},${t.status},"${cleanDesc}"`;
        }).join('\n');

        const csv = header + rows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: 'Failed to export transactions' });
    }
});

export default router;
