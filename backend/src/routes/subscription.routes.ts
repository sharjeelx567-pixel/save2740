import { Router, Response } from 'express';
import { Subscription } from '../models/subscription.model';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { connectDB } from '../config/db';

const router = Router();

/**
 * GET /api/subscription
 * Get user's subscription details
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    let subscription = await Subscription.findOne({ userId: req.userId });

    // If no subscription exists, create one
    if (!subscription) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

      subscription = new Subscription({
        userId: req.userId,
        planType: 'yearly',
        status: 'active',
        appFee: 292.80,
        accruedFees: 292.80, // Deferred - will be charged at maturity
        startDate,
        endDate,
        billingCycle: 'at_maturity',
        billingHistory: [
          {
            date: startDate,
            description: 'Yearly Plan Started',
            amount: 0, // Deferred
            status: 'pending',
          },
        ],
      });

      await subscription.save();
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
    });
  }
});

/**
 * GET /api/subscription/billing-history
 * Get billing history
 */
router.get('/billing-history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const subscription = await Subscription.findOne({ userId: req.userId });

    if (!subscription) {
      return res.json({
        success: true,
        data: [],
      });
    }

    res.json({
      success: true,
      data: subscription.billingHistory,
    });
  } catch (error) {
    console.error('Billing history fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing history',
    });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancel subscription
 */
router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { reason } = req.body;

    const subscription = await Subscription.findOne({ userId: req.userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelledBy = req.userId!;
    subscription.cancellationReason = reason || 'User requested cancellation';
    subscription.autoRenew = false;

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
    });
  }
});

/**
 * POST /api/subscription/export-csv
 * Export billing history as CSV
 */
router.post('/export-csv', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const subscription = await Subscription.findOne({ userId: req.userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found',
      });
    }

    // Generate CSV
    const csvHeader = 'Date,Description,Amount,Status\n';
    const csvRows = subscription.billingHistory
      .map((item) => {
        const date = new Date(item.date).toLocaleDateString();
        const description = item.description.replace(/,/g, ';'); // Escape commas
        const amount = `$${item.amount.toFixed(2)}`;
        const status = item.status;
        return `${date},${description},${amount},${status}`;
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=billing-history.csv');
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export CSV',
    });
  }
});

export default router;
