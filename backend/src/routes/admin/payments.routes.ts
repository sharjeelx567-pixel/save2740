import express, { Response } from 'express';
import mongoose from 'mongoose';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { Transaction } from '../../models/transaction.model';
import { User } from '../../models/auth.model';
import { Wallet } from '../../models/wallet.model';
import { connectDB } from '../../config/db';
import { getStripeProcessor } from '../../utils/stripe-processor';

const router = express.Router();

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments (wrapper around transactions for now, but focused on payments)
 * @access  Admin
 */
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { page = 1, limit = 20, search, status, type, startDate, endDate } = req.query;

        const query: any = {};

        if (type && type !== 'all') {
            query.type = type;
        } else {
            query.type = { $in: ['deposit', 'withdrawal', 'transfer', 'payment'] };
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) {
                const d = new Date(endDate as string);
                d.setHours(23, 59, 59, 999);
                query.createdAt.$lte = d;
            }
        }

        if (search) {
            const searchRegex = new RegExp(search as string, 'i');
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

        const skip = (Number(page) - 1) * Number(limit);

        const transactions = await Transaction.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: {
                payments: transactions,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get admin payments error:', error);
        res.status(500).json({ success: false, error: 'Failed to get payments' });
    }
});

/**
 * @route   GET /api/admin/payments/stats
 * @desc    Get payment statistics
 * @access  Admin
 */
router.get('/stats', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // Calculate total volume, success rate, etc.
        const stats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const formattedStats = {
            totalVolume: stats.reduce((acc, curr) => acc + (curr._id === 'completed' ? curr.totalAmount : 0), 0),
            successCount: stats.find(s => s._id === 'completed')?.count || 0,
            failedCount: stats.find(s => s._id === 'failed')?.count || 0,
            pendingCount: stats.find(s => s._id === 'pending')?.count || 0
        };

        res.json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Get payment stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get payment stats' });
    }
});

/**
 * @route   GET /api/admin/payments/:transactionId
 * @desc    Get payment details
 * @access  Admin
 */
router.get('/:transactionId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { transactionId } = req.params;

        const transaction = await Transaction.findOne({ transactionId }).populate('userId', 'firstName lastName email');

        if (!transaction) {
            // Try by _id if transactionId not found
            try {
                const txById = await Transaction.findById(transactionId).populate('userId', 'firstName lastName email');
                if (txById) {
                    return res.json({ success: true, data: txById });
                }
            } catch (e) { }

            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Get payment details error:', error);
        res.status(500).json({ success: false, error: 'Failed to get payment details' });
    }
});

/**
 * @route   POST /api/admin/payments/:transactionId/refund
 * @desc    Issue a refund
 * @access  Admin
 */
router.post('/:transactionId/refund', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { transactionId } = req.params;
        const { amount, reason } = req.body;

        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }

        if (transaction.status !== 'completed') {
            return res.status(400).json({ success: false, error: 'Cannot refund incomplete transaction' });
        }

        // Use Stripe Processor to refund
        try {
            const stripeProcessor = getStripeProcessor();
            // Assuming externalTransactionId stores the Stripe Payment Intent ID or Charge ID
            // And that our processor handles the logic of calling Stripe
            if (transaction.externalTransactionId && transaction.externalTransactionId.startsWith('pi_')) {
                const result = await stripeProcessor.refundPayment('stripe_' + transaction.externalTransactionId, amount); // Prefixing as per processor logic

                if (result.success) {
                    // Update transaction or create a new "Refund" transaction
                    transaction.status = 'refunded'; // Or partial
                    transaction.metadata = { ...transaction.metadata, refundReason: reason, refundId: result.refundId };
                    await transaction.save();

                    // Create refund record
                    await Transaction.create({
                        userId: transaction.userId,
                        type: 'refund',
                        amount: amount || transaction.amount,
                        status: 'completed',
                        description: `Refund for ${transaction.transactionId}`,
                        metadata: { originalTransactionId: transaction.transactionId, reason }
                    });

                    return res.json({ success: true, message: 'Refund issued successfully', data: result });
                } else {
                    return res.status(400).json({ success: false, error: result.error || 'Refund failed' });
                }
            } else {
                // Mock refund for non-stripe transactions
                transaction.status = 'refunded';
                await transaction.save();
                return res.json({ success: true, message: 'Refund marked manually (no Stripe ID present)' });
            }

        } catch (stripeError: any) {
            return res.status(500).json({ success: false, error: 'Stripe refund failed: ' + stripeError.message });
        }

    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ success: false, error: 'Failed to issue refund' });
    }
});

/**
 * @route   GET /api/admin/payments/disputes/list
 * @desc    View disputes (Placeholder)
 * @access  Admin
 */
router.get('/disputes/list', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    res.json({
        success: true,
        data: [] // Placeholder
    });
});

/**
 * @route   GET /api/admin/payments/wallets/balances
 * @desc    View wallet balances with filters (search, status, balanceMin, balanceMax)
 * @access  Admin
 */
router.get('/wallets/balances', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { page = 1, limit = 50, search, status, balanceMin, balanceMax } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const limitNum = Number(limit);

        let userIds: string[] | null = null;
        if (search && String(search).trim()) {
            const searchRegex = new RegExp(String(search).trim(), 'i');
            const users = await User.find({
                $or: [
                    { email: searchRegex },
                    { firstName: searchRegex },
                    { lastName: searchRegex }
                ]
            }).select('_id');
            userIds = users.map((u: any) => u._id.toString());
            if (userIds.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        wallets: [],
                        pagination: { page: Number(page), limit: limitNum, total: 0, pages: 0 },
                        totals: { totalBalance: 0, totalAvailable: 0, totalLocked: 0, totalEscrow: 0 }
                    }
                });
            }
        }

        const query: any = {};
        if (userIds) query.userId = { $in: userIds };
        if (status && status !== 'all') query.status = status;
        if (balanceMin != null && balanceMin !== '') {
            const n = Number(balanceMin);
            if (!isNaN(n)) { query.balance = query.balance || {}; query.balance.$gte = n; }
        }
        if (balanceMax != null && balanceMax !== '') {
            const n = Number(balanceMax);
            if (!isNaN(n)) { query.balance = query.balance || {}; query.balance.$lte = n; }
        }

        const [walletDocs, total] = await Promise.all([
            Wallet.find(query).sort({ balance: -1 }).skip(skip).limit(limitNum).lean(),
            Wallet.countDocuments(query)
        ]);

        const uIds = walletDocs.map((w: any) => w.userId).filter(Boolean);
        const objectIds = uIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id)).map((id: string) => new mongoose.Types.ObjectId(id));
        const users = objectIds.length ? await User.find({ _id: { $in: objectIds } }).select('firstName lastName email').lean() : [];
        const userMap: Record<string, any> = {};
        users.forEach((u: any) => { userMap[u._id.toString()] = u; });

        const wallets = walletDocs.map((w: any) => ({
            ...w,
            userId: { _id: w.userId, ...userMap[w.userId] }
        }));

        const totalsAgg = await Wallet.aggregate([
            ...(Object.keys(query).length ? [{ $match: query }] : []),
            { $group: { _id: null, totalBalance: { $sum: '$balance' }, totalAvailable: { $sum: '$availableBalance' }, totalLocked: { $sum: '$locked' }, totalEscrow: { $sum: '$escrowBalance' } } }
        ]);
        const totals = totalsAgg[0] || { totalBalance: 0, totalAvailable: 0, totalLocked: 0, totalEscrow: 0 };

        res.json({
            success: true,
            data: {
                wallets,
                pagination: { page: Number(page), limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
                totals
            }
        });
    } catch (error) {
        console.error('Get wallet balances error:', error);
        res.status(500).json({ success: false, error: 'Failed to get wallet balances' });
    }
});
/**
 * @route   POST /api/admin/payments/:transactionId/approve
 * @desc    Approve a pending payout/withdrawal
 * @access  Admin (Super Admin or Finance)
 */
router.post('/:transactionId/approve', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { transactionId } = req.params;
        const { notes } = req.body;

        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

        if (transaction.status !== 'pending') {
            return res.status(400).json({ success: false, error: `Transaction is ${transaction.status}, cannot approve` });
        }

        if (transaction.type !== 'withdrawal' && transaction.type !== 'payout') {
            return res.status(400).json({ success: false, error: 'Only withdrawals/payouts can be approved' });
        }

        // Process the payout (e.g., via Stripe, Bank, or just Ledger update)
        // For now, we update the ledger status. In a real integration, this would trigger the bank transfer.

        transaction.status = 'completed';
        transaction.metadata = { ...transaction.metadata, approvedBy: req.userId, approvalNotes: notes, approvedAt: new Date() };
        await transaction.save();

        // Audit Log
        const { AuditLog } = await import('../../models/audit-log');
        await AuditLog.create({
            userId: req.userId,
            action: 'APPROVE_PAYOUT',
            resourceType: 'transaction',
            resourceId: transaction._id.toString(),
            ipAddress: req.ip,
            severity: 'info',
            metadata: { transactionId, amount: transaction.amount, notes }
        });

        // Notify User (Placeholder for actual notification service)
        // notifyUser(transaction.userId, 'Your withdrawal has been approved.');

        res.json({ success: true, message: 'Payout approved successfully', data: transaction });

    } catch (error) {
        console.error('Approve payout error:', error);
        res.status(500).json({ success: false, error: 'Failed to approve payout' });
    }
});

/**
 * @route   POST /api/admin/payments/:transactionId/reject
 * @desc    Reject a pending payout/withdrawal
 * @access  Admin
 */
router.post('/:transactionId/reject', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { transactionId } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ success: false, error: 'Rejection reason is required' });

        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

        if (transaction.status !== 'pending') {
            return res.status(400).json({ success: false, error: `Transaction is ${transaction.status}, cannot reject` });
        }

        // Refund the wallet if money was deducted (usually 'pending' withdrawal means funds are locked or deducted)
        // Assuming strict ledger: if 'pending', funds might be in 'locked' state or already deducted.
        // We need to reverse the deduction if it was deducted.
        // For this system, let's assume we need to credit the user back.

        const { Wallet } = await import('../../models/wallet.model');
        const wallet = await Wallet.findOne({ userId: transaction.userId });

        if (wallet) {
            // Credit back the amount
            wallet.balance += transaction.amount;
            wallet.availableBalance += transaction.amount;
            await wallet.save();
        }

        transaction.status = 'failed'; // or 'rejected'
        transaction.metadata = { ...transaction.metadata, rejectedBy: req.userId, rejectionReason: reason, rejectedAt: new Date() };
        await transaction.save();

        // Create a separate "Refund" transaction record for the ledger reversal if needed
        // Or just rely on the status change. 
        // Best practice: Create a "Refund/Reversal" transaction to balance the ledger explicitly.
        await Transaction.create({
            userId: transaction.userId,
            type: 'refund',
            amount: transaction.amount,
            status: 'completed',
            description: `Reversal of ${transactionId}: ${reason}`,
            metadata: { originalTransactionId: transactionId }
        });

        // Audit Log
        const { AuditLog } = await import('../../models/audit-log');
        await AuditLog.create({
            userId: req.userId,
            action: 'REJECT_PAYOUT',
            resourceType: 'transaction',
            resourceId: transaction._id.toString(),
            ipAddress: req.ip,
            severity: 'warning',
            metadata: { transactionId, amount: transaction.amount, reason }
        });

        res.json({ success: true, message: 'Payout rejected and refunded', data: transaction });

    } catch (error) {
        console.error('Reject payout error:', error);
        res.status(500).json({ success: false, error: 'Failed to reject payout' });
    }
});

export default router;
