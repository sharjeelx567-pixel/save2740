import express, { Response } from 'express';
import { Transaction } from '../models/transaction.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

import { validate } from '../middleware/validate';
import { createPaymentIntentSchema } from '../schemas/payment.schema';
import { paymentLimiter } from '../middleware/rate-limiters';

const router = express.Router();

// GET /api/payments - same as wallet transactions but maybe with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// POST /api/payments/intent - Create payment intent
router.post('/intent', authenticateToken, paymentLimiter, validate(createPaymentIntentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // Mock Stripe Payment Intent
    res.json({
      success: true,
      data: {
        client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
        amount,
        currency
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create intent' });
  }
});

export default router;
