import express, { Response } from 'express';
import { User } from '../models/auth.model';
import { Wallet } from '../models/wallet.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/save2740/status - Get challenge status
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // In a real implementation this would fetch from a Challenge model
    // For now we derive it from wallet/user state
    const wallet = await Wallet.findOne({ userId: req.userId });

    res.json({
      success: true,
      data: {
        isActive: true, // Default to true
        currentDay: wallet?.currentStreak || 1,
        totalDays: 365,
        dailyAmount: wallet?.dailySavingAmount || 27.4,
        totalSaved: wallet?.balance || 0,
        targetAmount: (wallet?.dailySavingAmount || 27.4) * 365
      }
    });

  } catch (error) {
    console.error('Save2740 status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get challenge status'
    });
  }
});

// POST /api/save2740/join - Join the challenge
router.post('/join', authenticateToken, async (req: AuthRequest, res: Response) => {
  // Logic to initialize challenge for user
  // For now success
  res.json({
    success: true,
    message: 'Joined Save2740 Challenge'
  });
});

// POST /api/save2740/contribute - Manual daily save trigger
router.post('/contribute', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    // Logic for saving daily amount
    const amount = wallet.dailySavingAmount || 27.4;

    // Simulate finding funds source and checking success
    // In real app, this would trigger payment gateway

    // Update wallet
    wallet.balance += amount;
    // Don't update availableBalance, keep it locked
    wallet.locked += amount;
    wallet.currentStreak += 1;
    wallet.lastSaveDate = new Date();
    await wallet.save();

    res.json({
      success: true,
      data: {
        message: `Successfully saved $${amount}`,
        newBalance: wallet.balance,
        streak: wallet.currentStreak
      }
    });

  } catch (error) {
    console.error('Daily save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process daily save'
    });
  }
});

export default router;
