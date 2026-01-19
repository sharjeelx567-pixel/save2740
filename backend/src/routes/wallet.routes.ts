import express, { Response } from 'express';
import { Wallet } from '../models/wallet.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/wallet - Get wallet details
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    let wallet = await Wallet.findOne({ userId: req.userId });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.userId,
        balance: 0,
        availableBalance: 0,
        locked: 0,
        lockedInPockets: 0,
        referralEarnings: 0,
        currentStreak: 0,
        dailySavingAmount: 27.4
      });
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet'
    });
  }
});

import { Transaction } from '../models/transaction.model';

// ... (GET wallet stays same)

// GET /api/wallet/transactions - Get transaction history
router.get('/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 for performance

    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions'
    });
  }
});

// POST /api/wallet/deposit - Add money to wallet
router.post('/deposit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { amount, paymentMethodId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // 1. Create Transaction Record
    await Transaction.create({
      userId: req.userId,
      type: 'deposit',
      amount: amount,
      status: 'completed',
      description: 'Wallet Deposit',
      paymentMethodId: paymentMethodId || 'manual'
    });

    // 2. Update Wallet
    wallet.balance += amount;
    wallet.availableBalance += amount;
    await wallet.save();

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deposit'
    });
  }
});

// POST /api/wallet/withdraw - Withdraw money from wallet
router.post('/withdraw', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { amount, bankAccountId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // 1. Create Transaction (Pending -> Completed would be better, but instant for now)
    await Transaction.create({
      userId: req.userId,
      type: 'withdraw',
      amount: amount,
      status: 'completed',
      description: 'Wallet Withdrawal',
      paymentMethodId: bankAccountId || 'manual'
    });

    // 2. Update Wallet
    wallet.balance -= amount;
    wallet.availableBalance -= amount;
    await wallet.save();

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw'
    });
  }
});

export default router;
