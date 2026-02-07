import express, { Response } from 'express';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Referral, ReferralCode } from '../models/referral.model';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';
import { User } from '../models/auth.model';

const router = express.Router();

// GET /api/referrals - Get referral dashboard data
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get or create referral code
    // Get or create referral code using atomic operation to prevent race conditions
    const newCode = `SAVE${(userId || 'USER').substring(0, 6).toUpperCase()}${Math.floor(Math.random() * 1000)}`;

    const referralCode = await ReferralCode.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          code: newCode,
          isActive: true,
          totalReferrals: 0,
          totalEarnings: 0,
          totalPayouts: 0,
        }
      },
      { new: true, upsert: true }
    );

    // Ensure code exists
    if (!referralCode || !referralCode.code) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate referral code'
      });
    }

    // Get all referrals
    const referrals = await Referral.find({ referrerId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get wallet for earnings
    const wallet = await Wallet.findOne({ userId });

    // Calculate stats
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.status === 'active').length;
    const totalEarnings = referrals.reduce((sum, r) => sum + r.earnings, 0);
    const totalPayouts = referrals.reduce((sum, r) => sum + r.bonusPaid, 0);
    const pendingEarnings = totalEarnings - totalPayouts;

    res.json({
      success: true,
      data: {
        referralCode: referralCode.code,
        totalReferrals,
        activeReferrals,
        totalEarnings,
        totalPayouts,
        pendingEarnings,
        referrals: referrals.map(r => ({
          id: r._id,
          referredId: r.referredId,
          status: r.status,
          earnings: r.earnings,
          bonusEarned: r.bonusEarned,
          bonusPaid: r.bonusPaid,
          signupDate: r.signupDate,
          firstContributionDate: r.firstContributionDate,
        })),
        walletEarnings: wallet?.referralEarnings || 0,
      }
    });
  } catch (error: any) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get referrals'
    });
  }
});

// GET /api/referrals/code - Get referral code
router.get('/code', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get or create referral code using atomic operation to prevent race conditions
    // (This fixes the E11000 duplicate key error when parallel requests try to create a code)
    const newCode = `SAVE${(userId || 'USER').substring(0, 6).toUpperCase()}${Math.floor(Math.random() * 1000)}`;

    const referralCode = await ReferralCode.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          code: newCode,
          isActive: true,
          totalReferrals: 0,
          totalEarnings: 0,
          totalPayouts: 0,
        }
      },
      { new: true, upsert: true }
    );

    // Ensure code exists
    if (!referralCode || !referralCode.code) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate referral code'
      });
    }

    res.json({
      success: true,
      data: {
        code: referralCode.code,
        shareUrl: `${process.env.FRONTEND_URL || 'https://save2740.com'}/signup?ref=${referralCode.code}`,
        totalReferrals: referralCode.totalReferrals,
        totalEarnings: referralCode.totalEarnings,
      }
    });
  } catch (error: any) {
    console.error('Get referral code error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get referral code'
    });
  }
});

// GET /api/referrals/earnings - Get referral earnings history
router.get('/earnings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const referrals = await Referral.find({ referrerId: userId })
      .sort({ createdAt: -1 });

    const earnings = referrals.map(r => ({
      id: r._id,
      referralId: r.referredId,
      amount: r.bonusEarned,
      paid: r.bonusPaid,
      pending: r.bonusEarned - r.bonusPaid,
      date: r.signupDate,
      status: r.status,
    }));

    res.json({
      success: true,
      data: earnings
    });
  } catch (error: any) {
    console.error('Get referral earnings error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get earnings'
    });
  }
});

// GET /api/referrals/payouts - Get payout history
router.get('/payouts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const payouts = await Transaction.find({
      userId,
      type: 'referral_bonus',
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: payouts.map(t => ({
        id: t._id,
        transactionId: t.transactionId,
        amount: t.amount,
        date: t.createdAt,
        description: t.description,
      }))
    });
  } catch (error: any) {
    console.error('Get payout history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payout history'
    });
  }
});

// POST /api/referrals/invite - Send referral invite
router.post('/invite', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { email, name } = req.body;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Get referral code
    let referralCode = await ReferralCode.findOne({ userId });
    if (!referralCode) {
      const code = `SAVE${(userId || 'USER').substring(0, 6).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
      referralCode = await ReferralCode.create({
        userId,
        code: code,
        isActive: true,
      });
    }

    // In production, send email here
    // For now, just return success
    const shareUrl = `${process.env.FRONTEND_URL || 'https://save2740.com'}/signup?ref=${referralCode.code}`;

    res.json({
      success: true,
      data: {
        message: 'Invitation sent successfully',
        shareUrl,
      }
    });
  } catch (error: any) {
    console.error('Send invite error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send invitation'
    });
  }
});

// POST /api/referrals/validate - Validate and activate referral bonus
router.post('/validate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Find pending referrals for this user
    const referrals = await Referral.find({
      referredId: userId,
      status: 'pending',
      bonusEarned: 0 // Not yet rewarded
    });

    if (referrals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No pending referrals to validate'
      });
    }

    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ userId });

    if (!user || !wallet) {
      return res.status(404).json({ success: false, error: 'User or wallet not found' });
    }

    // Import validation function
    const { validateReferralBonus } = await import('../utils/referral-fraud-detection');
    const { Save2740Plan } = await import('../models/save2740.model');

    // Check eligibility
    const accountAge = Date.now() - user.createdAt.getTime();
    const activePlans = await Save2740Plan.countDocuments({ userId, status: 'active' });
    const completedPlans = await Save2740Plan.findOne({
      userId,
      status: { $in: ['active', 'completed'] }
    }).sort({ createdAt: 1 });

    const validation = validateReferralBonus(userId, {
      accountCreatedDate: user.createdAt,
      kycCompletedDate: user.kycStatus === 'approved' ? user.updatedAt : undefined,
      firstSavingsDate: completedPlans?.createdAt,
      activeSaverPockets: activePlans,
    });

    if (!validation.eligible) {
      return res.status(400).json({
        success: false,
        error: 'Not eligible for referral bonus yet',
        reasons: validation.reasons,
      });
    }

    // Activate referral and credit bonus
    const bonusAmount = validation.bonusAmount;
    const results = [];

    for (const referral of referrals) {
      // Update referral record
      referral.status = 'active';
      referral.bonusEarned = bonusAmount;
      referral.earnings = bonusAmount;
      referral.firstContributionDate = new Date();
      await referral.save();

      // Credit referrer's wallet
      const referrerWallet = await Wallet.findOne({ userId: referral.referrerId });
      if (referrerWallet) {
        referrerWallet.referralEarnings = (referrerWallet.referralEarnings || 0) + bonusAmount;
        await referrerWallet.save();
      }

      // Update referrer code stats
      await ReferralCode.updateOne(
        { userId: referral.referrerId },
        { $inc: { totalEarnings: bonusAmount } }
      );

      // Create transaction record
      await Transaction.create({
        userId: referral.referrerId,
        transactionId: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'referral_bonus',
        amount: bonusAmount,
        status: 'completed',
        description: `Referral bonus for ${user.email}`,
        metadata: {
          referralId: referral._id.toString(),
          referredUserId: userId,
        },
      });

      results.push({
        referralId: referral._id,
        bonusAmount,
        referrerId: referral.referrerId,
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Referral bonus activated',
        bonusAmount,
        referralsActivated: results.length,
        results,
      }
    });
  } catch (error: any) {
    console.error('Validate referral error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate referral'
    });
  }
});

// POST /api/referrals/payout - Request payout of referral earnings
router.post('/payout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const availableEarnings = wallet.referralEarnings || 0;
    if (availableEarnings <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No referral earnings available for payout'
      });
    }

    // Minimum payout threshold
    const MIN_PAYOUT = 10.00;
    if (availableEarnings < MIN_PAYOUT) {
      return res.status(400).json({
        success: false,
        error: `Minimum payout amount is $${MIN_PAYOUT.toFixed(2)}`,
        availableEarnings,
      });
    }

    // Transfer referral earnings to main wallet balance
    wallet.balance += availableEarnings;
    wallet.availableBalance += availableEarnings;
    wallet.referralEarnings = 0;
    await wallet.save();

    // Update referral records - use aggregation pipeline to set bonusPaid = bonusEarned
    await Referral.updateMany(
      { referrerId: userId },
      [
        {
          $set: {
            bonusPaid: '$bonusEarned',
            lastPayoutDate: new Date()
          }
        }
      ]
    );

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      transactionId: `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'referral_bonus',
      amount: availableEarnings,
      status: 'completed',
      description: 'Referral earnings payout to wallet',
    });

    // Update referral code stats
    await ReferralCode.updateOne(
      { userId },
      { $inc: { totalPayouts: availableEarnings } }
    );

    res.json({
      success: true,
      data: {
        message: 'Payout successful',
        amount: availableEarnings,
        newBalance: wallet.balance,
        transactionId: transaction.transactionId,
      }
    });
  } catch (error: any) {
    console.error('Payout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payout failed'
    });
  }
});

export default router;
