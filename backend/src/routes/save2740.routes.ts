import express, { Response } from 'express';
import { User } from '../models/auth.model';
import { Wallet } from '../models/wallet.model';
import { Save2740Plan } from '../models/save2740.model';
import { Transaction } from '../models/transaction.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { joinChallengeSchema, contributeSchema, updateChallengeSchema } from '../schemas/save2740.schema';

const router = express.Router();

// GET /api/save2740 - Get all plans for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const plans = await Save2740Plan.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get Save2740 plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get plans'
    });
  }
});

// GET /api/save2740/:id - Get specific plan
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const plan = await Save2740Plan.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get Save2740 plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get plan'
    });
  }
});

// GET /api/save2740/status - Get challenge status
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const activePlan = await Save2740Plan.findOne({
      userId: req.userId,
      status: 'active'
    });

    if (!activePlan) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          message: 'No active plan found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        isActive: true,
        planId: activePlan._id,
        currentDay: activePlan.daysActive || 1,
        totalDays: 365,
        dailyAmount: activePlan.dailyAmount || activePlan.weeklyAmount ? (activePlan.weeklyAmount || 0) / 7 : 27.4,
        totalSaved: activePlan.currentBalance || 0,
        targetAmount: activePlan.totalTargetAmount,
        status: activePlan.status,
        streakDays: activePlan.streakDays || 0
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

// POST /api/save2740 - Create new plan (Start Save2740 Plan)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { planName, description, totalTargetAmount, savingsMode, dailySavingsAmount, weeklySavingsAmount, autoFund, autoFundPaymentMethodId } = req.body;

    if (!planName || !totalTargetAmount || !savingsMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: planName, totalTargetAmount, savingsMode'
      });
    }

    // Check if user already has an active plan
    const existingActivePlan = await Save2740Plan.findOne({
      userId: req.userId,
      status: 'active'
    });

    if (existingActivePlan) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active Save2740 plan. Please pause or complete your current plan before starting a new one.'
      });
    }

    // Calculate amounts if not provided
    let dailyAmount = dailySavingsAmount;
    let weeklyAmount = weeklySavingsAmount;

    if (savingsMode === 'daily' && !dailyAmount) {
      dailyAmount = totalTargetAmount / 365;
    } else if (savingsMode === 'weekly' && !weeklyAmount) {
      weeklyAmount = totalTargetAmount / 52;
      dailyAmount = weeklyAmount / 7;
    }

    // Calculate completion date (365 days from start)
    const startDate = new Date();
    const targetCompletionDate = new Date(startDate);
    targetCompletionDate.setDate(targetCompletionDate.getDate() + 365);

    const plan = await Save2740Plan.create({
      userId: req.userId,
      name: planName,
      description: description || '',
      status: 'active',
      savingsMode: savingsMode,
      dailyAmount: savingsMode === 'daily' ? dailyAmount : undefined,
      weeklyAmount: savingsMode === 'weekly' ? weeklyAmount : undefined,
      totalTargetAmount: totalTargetAmount,
      currentBalance: 0,
      startDate: startDate,
      targetCompletionDate: targetCompletionDate,
      nextContributionDate: new Date(startDate.getTime() + (savingsMode === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)),
      autoFund: autoFund || false,
      autoFundPaymentMethodId: autoFundPaymentMethodId || undefined,
      contributionCount: 0,
      daysActive: 0,
      streakDays: 0
    });

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Save2740 plan created successfully'
    });
  } catch (error: any) {
    console.error('Create Save2740 plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create plan'
    });
  }
});

// POST /api/save2740/join - Join the challenge (legacy endpoint)
router.post('/join', authenticateToken, validate(joinChallengeSchema), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Check if user already has an active plan
    const existingPlan = await Save2740Plan.findOne({
      userId: req.userId,
      status: 'active'
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active Save2740 plan'
      });
    }

    // Create default plan
    const { challengeType, multiplier, autoDebit } = req.body;
    const dailyAmount = 27.4 * (multiplier || 1);
    const totalTargetAmount = dailyAmount * 365;

    const startDate = new Date();
    const targetCompletionDate = new Date(startDate);
    targetCompletionDate.setDate(targetCompletionDate.getDate() + 365);

    const plan = await Save2740Plan.create({
      userId: req.userId,
      name: 'Save2740 Challenge',
      description: 'Default Save2740 savings challenge',
      status: 'active',
      savingsMode: challengeType === 'daily' ? 'daily' : 'weekly',
      dailyAmount: challengeType === 'daily' ? dailyAmount : undefined,
      weeklyAmount: challengeType === 'weekly' ? dailyAmount * 7 : undefined,
      totalTargetAmount: totalTargetAmount,
      currentBalance: 0,
      startDate: startDate,
      targetCompletionDate: targetCompletionDate,
      nextContributionDate: new Date(startDate.getTime() + 24 * 60 * 60 * 1000),
      autoFund: autoDebit || false,
      contributionCount: 0,
      daysActive: 0,
      streakDays: 0
    });

    res.json({
      success: true,
      data: plan,
      message: 'Joined Save2740 Challenge'
    });
  } catch (error: any) {
    console.error('Join challenge error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to join challenge'
    });
  }
});

// POST /api/save2740/contribute - Manual contribution
router.post('/contribute', authenticateToken, validate(contributeSchema), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { amount, paymentMethodId } = req.body;
    const wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Find active plan
    const plan = await Save2740Plan.findOne({
      userId: req.userId,
      status: 'active'
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'No active Save2740 plan found'
      });
    }

    // Check if user has sufficient balance
    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Process payment if paymentMethodId is provided
    if (paymentMethodId) {
      // In production, process payment via Stripe here
      // For now, just deduct from wallet
    }

    // Update wallet
    wallet.availableBalance -= amount;
    wallet.locked += amount;
    wallet.balance += amount;
    await wallet.save();

    // Update plan
    plan.currentBalance += amount;
    plan.totalContributions += amount;
    plan.contributionCount += 1;
    plan.lastContributionDate = new Date();
    plan.daysActive += 1;
    plan.streakDays += 1;
    
    // Update longest streak
    if (plan.streakDays > plan.longestStreak) {
      plan.longestStreak = plan.streakDays;
    }
    
    // Update next contribution date
    if (plan.savingsMode === 'daily') {
      plan.nextContributionDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      plan.nextContributionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Check if plan is completed
    let isCompleted = false;
    if (plan.currentBalance >= plan.totalTargetAmount) {
      plan.status = 'completed';
      plan.completionDate = new Date();
      isCompleted = true;
      
      // Move locked funds to available on completion
      wallet.locked -= plan.currentBalance;
      wallet.availableBalance += plan.currentBalance;
      await wallet.save();
    }

    await plan.save();

    // Create transaction record
    await Transaction.create({
      userId: req.userId,
      type: 'save_daily',
      amount: amount,
      status: 'completed',
      description: `Save2740 contribution - ${plan.name}`,
      paymentMethodId: paymentMethodId,
      metadata: {
        planId: plan._id.toString(),
        planName: plan.name
      }
    });

    res.json({
      success: true,
      data: {
        message: `Successfully contributed $${amount.toFixed(2)}`,
        newBalance: plan.currentBalance,
        planStatus: plan.status,
        streak: plan.streakDays,
        isCompleted: isCompleted,
        completionData: isCompleted ? {
          totalSaved: plan.currentBalance,
          targetAmount: plan.totalTargetAmount,
          daysToComplete: plan.daysActive,
          totalContributions: plan.contributionCount,
          longestStreak: plan.longestStreak
        } : undefined
      }
    });
  } catch (error: any) {
    console.error('Contribute error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process contribution'
    });
  }
});

// POST /api/save2740/:id/complete - Manually mark plan as completed
router.post('/:id/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const plan = await Save2740Plan.findOne({
      _id: req.params.id,
      userId: req.userId,
      status: 'active'
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Active plan not found'
      });
    }

    // Verify plan has reached target
    if (plan.currentBalance < plan.totalTargetAmount) {
      return res.status(400).json({
        success: false,
        error: `Cannot complete plan. Current balance ($${plan.currentBalance}) is less than target ($${plan.totalTargetAmount})`
      });
    }

    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Mark as completed
    plan.status = 'completed';
    plan.completionDate = new Date();
    await plan.save();

    // Move locked funds to available
    wallet.locked -= plan.currentBalance;
    wallet.availableBalance += plan.currentBalance;
    await wallet.save();

    res.json({
      success: true,
      data: {
        planId: plan._id,
        status: 'completed',
        completionData: {
          totalSaved: plan.currentBalance,
          targetAmount: plan.totalTargetAmount,
          daysToComplete: plan.daysActive,
          totalContributions: plan.contributionCount,
          longestStreak: plan.longestStreak || plan.streakDays
        },
        message: 'Congratulations! Plan completed successfully! 🎉'
      }
    });
  } catch (error: any) {
    console.error('Complete plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete plan'
    });
  }
});

// POST /api/save2740/pause - Pause the plan
router.post('/pause', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'planId is required'
      });
    }

    const plan = await Save2740Plan.findOne({
      _id: planId,
      userId: req.userId,
      status: 'active'
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'No active plan found with that ID'
      });
    }

    // State transition validation: only active -> paused is allowed
    if (plan.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Cannot pause a ${plan.status} plan. Only active plans can be paused.`
      });
    }

    plan.status = 'paused';
    await plan.save();

    res.json({
      success: true,
      data: {
        planId: plan._id,
        status: 'paused',
        balance: plan.currentBalance,
        message: 'Plan paused successfully'
      }
    });
  } catch (error: any) {
    console.error('Pause plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pause plan'
    });
  }
});

// POST /api/save2740/resume - Resume the plan
router.post('/resume', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'planId is required'
      });
    }

    // Check if user already has another active plan
    const existingActivePlan = await Save2740Plan.findOne({
      userId: req.userId,
      status: 'active',
      _id: { $ne: planId }
    });

    if (existingActivePlan) {
      return res.status(400).json({
        success: false,
        error: 'You already have another active plan. Please pause or complete it before resuming this plan.'
      });
    }

    const plan = await Save2740Plan.findOne({
      _id: planId,
      userId: req.userId,
      status: 'paused'
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'No paused plan found with that ID'
      });
    }

    // State transition validation: only paused -> active is allowed
    if (plan.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: `Cannot resume a ${plan.status} plan. Only paused plans can be resumed.`
      });
    }

    plan.status = 'active';
    
    // Edge case: Reset streak if paused for more than the contribution frequency
    const now = new Date();
    if (plan.lastContributionDate) {
      const daysSinceLastContribution = Math.floor(
        (now.getTime() - new Date(plan.lastContributionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const missedThreshold = plan.savingsMode === 'daily' ? 2 : 8; // 2 days or 8 days
      
      if (daysSinceLastContribution > missedThreshold) {
        // Reset streak due to missed days
        plan.streakDays = 0;
      }
    }
    
    // Update next contribution date
    if (plan.savingsMode === 'daily') {
      plan.nextContributionDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      plan.nextContributionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    await plan.save();

    res.json({
      success: true,
      data: {
        planId: plan._id,
        status: 'active',
        balance: plan.currentBalance,
        message: 'Plan resumed successfully'
      }
    });
  } catch (error: any) {
    console.error('Resume plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resume plan'
    });
  }
});

// POST /api/save2740/cancel - Cancel the plan
router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { planId, reason, withdrawBalance } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'planId is required'
      });
    }

    const plan = await Save2740Plan.findOne({
      _id: planId,
      userId: req.userId,
      status: { $in: ['active', 'paused'] }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found or already cancelled/completed'
      });
    }

    // State transition validation: only active or paused -> cancelled
    if (!['active', 'paused'].includes(plan.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel a ${plan.status} plan. Only active or paused plans can be cancelled.`
      });
    }

    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Cancel any pending transactions for this plan
    await Transaction.updateMany(
      {
        userId: req.userId,
        status: 'pending',
        'metadata.planId': plan._id.toString()
      },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: 'Plan cancelled by user'
        }
      }
    );

    // Cancel the plan
    plan.status = 'cancelled';
    await plan.save();

    // If withdrawBalance is true, move locked funds to available
    if (withdrawBalance && plan.currentBalance > 0) {
      wallet.availableBalance += plan.currentBalance;
      wallet.locked -= plan.currentBalance;
      await wallet.save();
    }

    res.json({
      success: true,
      data: {
        planId: plan._id,
        status: 'cancelled',
        balance: plan.currentBalance,
        balanceWithdrawn: withdrawBalance,
        message: 'Plan cancelled successfully. All future deductions have been stopped.'
      }
    });
  } catch (error: any) {
    console.error('Cancel plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel plan'
    });
  }
});

// POST /api/save2740/restart - Restart a completed or cancelled plan
router.post('/restart', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'planId is required'
      });
    }

    // Check if user already has an active plan
    const existingActivePlan = await Save2740Plan.findOne({
      userId: req.userId,
      status: 'active'
    });

    if (existingActivePlan) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active plan. Please pause or complete it before restarting another plan.'
      });
    }

    const oldPlan = await Save2740Plan.findOne({
      _id: planId,
      userId: req.userId,
      status: { $in: ['completed', 'cancelled'] }
    });

    if (!oldPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found or cannot be restarted. Only completed or cancelled plans can be restarted.'
      });
    }

    // Create new plan based on old plan
    const startDate = new Date();
    const targetCompletionDate = new Date(startDate);
    targetCompletionDate.setDate(targetCompletionDate.getDate() + 365);

    const newPlan = await Save2740Plan.create({
      userId: req.userId,
      name: `${oldPlan.name} (Restarted)`,
      description: oldPlan.description || '',
      status: 'active',
      savingsMode: oldPlan.savingsMode,
      dailyAmount: oldPlan.dailyAmount,
      weeklyAmount: oldPlan.weeklyAmount,
      totalTargetAmount: oldPlan.totalTargetAmount,
      currentBalance: 0,
      startDate: startDate,
      targetCompletionDate: targetCompletionDate,
      nextContributionDate: new Date(startDate.getTime() + (oldPlan.savingsMode === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)),
      autoFund: oldPlan.autoFund,
      autoFundPaymentMethodId: oldPlan.autoFundPaymentMethodId,
      contributionCount: 0,
      daysActive: 0,
      streakDays: 0,
      longestStreak: 0,
      totalContributions: 0
    });

    res.json({
      success: true,
      data: newPlan,
      message: 'Plan restarted successfully'
    });
  } catch (error: any) {
    console.error('Restart plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restart plan'
    });
  }
});

export default router;
