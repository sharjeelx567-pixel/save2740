import express, { Response } from 'express';
import { Wallet } from '../models/wallet.model';
import { User } from '../models/auth.model';
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

    // For now, return empty achievements
    // You can implement achievement logic based on your models
    res.json({
      success: true,
      data: {
        achievements: [],
        totalPoints: 0
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

// GET /api/dashboard/savings-breakdown
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

export default router;
