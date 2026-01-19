import express, { Response } from 'express';
import { User } from '../models/auth.model';
import { Wallet } from '../models/wallet.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/referrals/stats - Get referral stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Get current user to get their referral code
    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!currentUser.referralCode) {
      // Generate one if missing (should exist from signup, but safety check)
      currentUser.referralCode = `${currentUser.firstName.substring(0, 3).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await currentUser.save();
    }

    // Count referrals
    const referralCount = await User.countDocuments({ referredBy: currentUser.referralCode });

    // Get earnings from wallet
    const wallet = await Wallet.findOne({ userId: req.userId });

    res.json({
      success: true,
      data: {
        referralCode: currentUser.referralCode,
        totalReferrals: referralCount,
        totalEarnings: wallet?.referralEarnings || 0,
        pendingEarnings: 0 // Placeholder logic
      }
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral statistics'
    });
  }
});

// GET /api/referrals/list - Get list of referred users
router.get('/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const currentUser = await User.findById(req.userId);

    if (!currentUser || !currentUser.referralCode) {
      return res.json({ success: true, data: [] });
    }

    const referrals = await User.find({ referredBy: currentUser.referralCode })
      .select('firstName lastName createdAt emailVerified kycStatus')
      .sort({ createdAt: -1 });

    const formattedReferrals = referrals.map(user => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      date: user.createdAt,
      status: user.emailVerified ? 'Active' : 'Pending',
      earned: 0 // Placeholder - would calculate based on their activity
    }));

    res.json({
      success: true,
      data: formattedReferrals
    });
  } catch (error) {
    console.error('Referral list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral list'
    });
  }
});

export default router;
