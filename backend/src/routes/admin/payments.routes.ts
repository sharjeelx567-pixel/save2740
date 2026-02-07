import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { Transaction } from '../../models/transaction.model';
import { User } from '../../models/auth.model';
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
        const { page = 1, limit = 20, search, status } = req.query;

        const query: any = {
            type: { $in: ['deposit', 'withdrawal', 'transfer', 'payment'] } // Focus on money movement
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        // Simple search if provided
        if (search) {
            const searchRegex = new RegExp(search as string, 'i');
            query.$or = [
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
 * @desc    View wallet balances (Placeholder - assumes simple calc for now)
 * @access  Admin
 */
router.get('/wallets/balances', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        // Aggregation to sum up all completed deposits - withdrawals for each user
        // distinct users with transactions
        // This is expensive, so just getting a few for demo

        const balances = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: '$userId',
                    balance: {
                        $sum: {
                            $cond: [
                                { $in: ['$type', ['deposit', 'refund', 'income']] },
                                '$amount',
                                { $multiply: ['$amount', -1] }
                            ]
                        }
                    }
                }
            },
            { $limit: 20 }
        ]);

        // Populate user details manually since aggregate lookup is verbose to write here inline
        const userIds = balances.map(b => b._id);
        const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName email');

        const result = balances.map(b => {
            const user = users.find(u => u._id.toString() === b._id.toString());
            return {
                userId: b._id,
                user: user ? { name: `${user.firstName} ${user.lastName}`, email: user.email } : { name: 'Unknown', email: '' },
                balance: b.balance
            };
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get wallet balances error:', error);
        res.status(500).json({ success: false, error: 'Failed to get wallet balances' });
    }
});

export default router;
