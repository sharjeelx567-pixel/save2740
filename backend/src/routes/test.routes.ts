import express from 'express';
import { Transaction } from '../models/transaction.model';
import { Wallet } from '../models/wallet.model';
import { connectDB } from '../config/db';

const router = express.Router();

/**
 * TEST ENDPOINT - DO NOT USE IN PRODUCTION
 * Manually create a test transaction without going through Stripe
 */
router.post('/create-test-deposit', async (req: express.Request, res: express.Response) => {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }

    try {
        await connectDB();

        const { userId, amount } = req.body;

        if (!userId || !amount) {
            return res.status(400).json({ error: 'userId and amount required' });
        }

        // Create test transaction
        const transaction = await Transaction.create({
            userId,
            type: 'deposit',
            amount: parseFloat(amount),
            status: 'completed',
            description: 'Test Deposit (Manual)',
            externalTransactionId: `test_${Date.now()}`,
            paymentMethodId: 'test_card',
            completedAt: new Date(),
            metadata: {
                testMode: true,
                source: 'manual_test_endpoint'
            }
        });

        // Update wallet
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
            wallet.balance += parseFloat(amount);
            wallet.availableBalance += parseFloat(amount);
            await wallet.save();
        } else {
            return res.status(404).json({ error: 'Wallet not found for user' });
        }

        console.log(`✅ Test transaction created: ${transaction.transactionId} for $${amount}`);

        res.json({
            success: true,
            transaction: {
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                status: transaction.status,
                type: transaction.type
            },
            wallet: {
                balance: wallet.balance,
                availableBalance: wallet.availableBalance
            }
        });

    } catch (error: any) {
        console.error('Test transaction error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
