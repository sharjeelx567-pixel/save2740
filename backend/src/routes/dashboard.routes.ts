import express, { Response } from 'express';
import { Wallet } from '../models/wallet.model';
import { User } from '../models/auth.model';
import { Transaction } from '../models/transaction.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/dashboard/overview
router.get('/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });
    const user = await User.findById(req.userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance || 0,
        availableBalance: wallet.availableBalance || 0,
        locked: wallet.locked || 0,
        lockedInPockets: wallet.lockedInPockets || 0,
        currentStreak: wallet.currentStreak || 0,
        dailySavingAmount: wallet.dailySavingAmount || 27.4,
        user: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email
        }
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard overview'
    });
  }
});

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: {
        totalSaved: wallet.balance || 0,
        currentStreak: wallet.currentStreak || 0,
        dailyGoal: wallet.dailySavingAmount || 27.4,
        referralEarnings: wallet.referralEarnings || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard stats'
    });
  }
});

// GET /api/dashboard/streak
router.get('/streak', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });

    res.json({
      success: true,
      data: {
        currentStreak: wallet?.currentStreak || 0,
        longestStreak: wallet?.longestStreak || 0,
        lastSaveDate: wallet?.lastSaveDate || null
      }
    });
  } catch (error) {
    console.error('Dashboard streak error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get streak data'
    });
  }
});

// GET /api/dashboard/achievements
router.get('/achievements', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });
    
    // Calculate achievements based on wallet data
    const balance = wallet?.balance || 0;
    const currentStreak = wallet?.currentStreak || 0;
    
    // Define achievements with unlock conditions
    // Matches milestones in frontend milestone-modal.tsx
    const achievements = [
      // Streak achievements
      {
        id: 'streak_7',
        title: '7 Day Streak',
        desc: 'Consistency is key!',
        completed: currentStreak >= 7,
        locked: currentStreak < 7,
        icon: 'flame',
        points: 50
      },
      {
        id: 'streak_30',
        title: 'Month Master',
        desc: '30 days straight!',
        completed: currentStreak >= 30,
        locked: currentStreak < 30,
        icon: 'calendar',
        points: 200
      },
      {
        id: 'streak_100',
        title: 'Century Club',
        desc: '100 day saving streak',
        completed: currentStreak >= 100,
        locked: currentStreak < 100,
        icon: 'trophy',
        points: 500
      },
      // Balance achievements - matches milestone-modal.tsx MILESTONES
      {
        id: 'balance_500',
        title: 'Savings Starter',
        desc: 'Save $500 to unlock',
        completed: balance >= 500,
        locked: balance < 500,
        icon: 'seedling',
        points: 100
      },
      {
        id: 'balance_1000',
        title: 'Bronze Saver',
        desc: 'Save $1,000 to unlock',
        completed: balance >= 1000,
        locked: balance < 1000,
        icon: 'medal-bronze',
        points: 200
      },
      {
        id: 'balance_2500',
        title: 'Silver Saver',
        desc: 'Save $2,500 to unlock',
        completed: balance >= 2500,
        locked: balance < 2500,
        icon: 'medal-silver',
        points: 300
      },
      {
        id: 'balance_5000',
        title: 'Gold Saver',
        desc: 'Save $5,000 to unlock',
        completed: balance >= 5000,
        locked: balance < 5000,
        icon: 'medal-gold',
        points: 500
      },
      {
        id: 'balance_7500',
        title: 'Platinum Saver',
        desc: 'Save $7,500 to unlock',
        completed: balance >= 7500,
        locked: balance < 7500,
        icon: 'diamond',
        points: 750
      },
      {
        id: 'balance_10000',
        title: 'Master Saver',
        desc: 'Reach the $10,000 yearly goal',
        completed: balance >= 10000,
        locked: balance < 10000,
        icon: 'crown',
        points: 1000
      }
    ];
    
    // Calculate total points from completed achievements
    const totalPoints = achievements
      .filter(a => a.completed)
      .reduce((sum, a) => sum + a.points, 0);

    res.json({
      success: true,
      data: {
        achievements,
        totalPoints,
        unlockedCount: achievements.filter(a => a.completed).length,
        totalCount: achievements.length
      }
    });
  } catch (error) {
    console.error('Dashboard achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements'
    });
  }
});

// GET /api/dashboard/breakdown (alias for savings-breakdown)
router.get('/breakdown', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });

    res.json({
      success: true,
      data: {
        available: wallet?.availableBalance || 0,
        locked: wallet?.locked || 0,
        inPockets: wallet?.lockedInPockets || 0,
        total: wallet?.balance || 0
      }
    });
  } catch (error) {
    console.error('Dashboard breakdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get savings breakdown'
    });
  }
});

// GET /api/dashboard/savings-breakdown (same as /breakdown)
router.get('/savings-breakdown', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });

    res.json({
      success: true,
      data: {
        available: wallet?.availableBalance || 0,
        locked: wallet?.locked || 0,
        inPockets: wallet?.lockedInPockets || 0,
        total: wallet?.balance || 0
      }
    });
  } catch (error) {
    console.error('Dashboard breakdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get savings breakdown'
    });
  }
});

// GET /api/dashboard/contribution
router.get('/contribution', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });

    res.json({
      success: true,
      data: {
        dailyAmount: wallet?.dailySavingAmount || 27.4,
        totalSaved: wallet?.balance || 0,
        daysActive: wallet?.currentStreak || 0
      }
    });
  } catch (error) {
    console.error('Dashboard contribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contribution data'
    });
  }
});

// GET /api/dashboard/projections
router.get('/projections', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });
    const dailyAmount = wallet?.dailySavingAmount || 27.4;

    res.json({
      success: true,
      data: {
        weekly: dailyAmount * 7,
        monthly: dailyAmount * 30,
        yearly: dailyAmount * 365,
        goal: 10000 // Default yearly goal
      }
    });
  } catch (error) {
    console.error('Dashboard projections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get projections'
    });
  }
});

// POST /api/dashboard/contribution - Process manual contribution
router.post('/contribution', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { amount, paymentMethodId, planId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Check if already contributed today
    const today = new Date().toISOString().split('T')[0];
    const lastSaveDate = wallet.lastSaveDate ? new Date(wallet.lastSaveDate).toISOString().split('T')[0] : null;
    
    if (lastSaveDate === today) {
      return res.status(400).json({
        success: false,
        error: 'Already contributed today'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'deposit',
      amount,
      description: 'Daily savings contribution',
      status: 'completed',
      metadata: {
        source: 'manual_contribution',
        planId: planId || null,
        paymentMethodId: paymentMethodId || null
      }
    });

    // Update wallet
    wallet.balance += amount;
    wallet.availableBalance += amount;
    wallet.lastSaveDate = new Date();

    // Update streak
    if (lastSaveDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastSaveDate === yesterdayStr) {
        wallet.currentStreak = (wallet.currentStreak || 0) + 1;
        if (wallet.currentStreak > (wallet.longestStreak || 0)) {
          wallet.longestStreak = wallet.currentStreak;
        }
      } else {
        wallet.currentStreak = 1;
      }
    } else {
      wallet.currentStreak = 1;
      wallet.longestStreak = 1;
    }

    await wallet.save();

    res.json({
      success: true,
      data: {
        transactionId: transaction._id,
        amount,
        newBalance: wallet.balance,
        streakUpdated: true,
        newStreak: wallet.currentStreak
      }
    });

  } catch (error) {
    console.error('Process contribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process contribution'
    });
  }
});

export default router;
