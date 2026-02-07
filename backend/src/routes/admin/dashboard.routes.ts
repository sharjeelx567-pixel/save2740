import express, { Response } from 'express';
import { User } from '../../models/auth.model';
import { Wallet } from '../../models/wallet.model';
import { Transaction } from '../../models/transaction';
import { KycDocument } from '../../models/kyc-document';
import { connectDB } from '../../config/db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// GET /api/admin/dashboard/stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // Get total users count
        const totalUsers = await User.countDocuments();

        // Get active users (users who logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: thirtyDaysAgo }
        });

        // Get pending KYC count
        const pendingKYC = await KycDocument.countDocuments({
            status: 'pending'
        });

        // Get total wallet balance
        const walletAggregation = await Wallet.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$balance' }
                }
            }
        ]);
        const totalWalletBalance = walletAggregation.length > 0 ? walletAggregation[0].total : 0;

        // Get daily transactions count (today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailyTransactions = await Transaction.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // Get failed payments count (today)
        const failedPayments = await Transaction.countDocuments({
            status: 'failed',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // --- Chart Data Aggregation ---

        // 1. Transaction Volume (Last 30 Days)
        const transactionVolumeRaw = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days
        const transactionVolume = [];
        for (let d = new Date(thirtyDaysAgo); d <= endOfDay; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const found = transactionVolumeRaw.find(item => item._id === dateStr);
            transactionVolume.push({
                date: dateStr,
                amount: found ? found.amount : 0
            });
        }

        // 2. User Growth (Last 30 Days)
        const userGrowthRaw = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const userGrowth = [];
        for (let d = new Date(thirtyDaysAgo); d <= endOfDay; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const found = userGrowthRaw.find(item => item._id === dateStr);
            userGrowth.push({
                date: dateStr,
                count: found ? found.count : 0
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                pendingKYC,
                totalWalletBalance,
                dailyTransactions,
                failedPayments,
                activePlans: 0,
                totalRevenue: totalWalletBalance,
                charts: {
                    transactionVolume,
                    userGrowth
                }
            }
        });

    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET /api/admin/dashboard/activity
router.get('/activity', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // Get recent activities (last 50 transactions/events)
        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'firstName lastName email');

        const activities = recentTransactions.map((tx: any) => ({
            id: tx._id,
            type: tx.type || 'Transaction',
            description: `${tx.type} - ${tx.amount} ${tx.currency || 'USD'}`,
            timestamp: tx.createdAt,
            user: tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : 'Unknown',
            status: tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'
        }));

        return res.status(200).json({
            success: true,
            data: activities
        });

    } catch (error: any) {
        console.error('Dashboard activity error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET /api/admin/dashboard/alerts
router.get('/alerts', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const alerts = [];

        // Check for pending KYC
        const pendingKYC = await KycDocument.countDocuments({ status: 'pending' });
        if (pendingKYC > 0) {
            alerts.push({
                id: 'kyc-pending',
                type: 'warning',
                title: 'Pending KYC Requests',
                message: `There are ${pendingKYC} KYC requests awaiting review`
            });
        }

        // Check for failed payments today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const failedPayments = await Transaction.countDocuments({
            status: 'failed',
            createdAt: { $gte: startOfDay }
        });
        if (failedPayments > 5) {
            alerts.push({
                id: 'failed-payments',
                type: 'error',
                title: 'High Failed Payment Rate',
                message: `${failedPayments} payments failed today. Please investigate.`
            });
        }

        return res.status(200).json({
            success: true,
            data: alerts
        });

    } catch (error: any) {
        console.error('Dashboard alerts error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

export default router;
