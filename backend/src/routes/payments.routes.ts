import express, { Response } from 'express';
import { Transaction } from '../models/transaction.model';
import { User } from '../models/auth.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ReceiptService } from '../services/receipt.service';

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
    await connectDB();

    const { amount, currency = 'usd' } = req.body;

    // Use Stripe if available, otherwise mock
    try {
      const { getStripeProcessor } = require('../utils/stripe-processor');
      const stripeProcessor = getStripeProcessor();

      let customerId = undefined;

      // Get user to check for existing customer ID
      const user = await User.findById(req.userId);
      if (user) {
        if (user.stripeCustomerId) {
          customerId = user.stripeCustomerId;
        } else {
          // Create new customer
          customerId = await stripeProcessor.createCustomer(
            user.email,
            `${user.firstName} ${user.lastName}`,
            { userId: req.userId }
          );
          user.stripeCustomerId = customerId;
          await user.save();
        }
      }

      // Create payment intent with Stripe
      const { clientSecret, paymentIntentId } = await stripeProcessor.createPaymentIntent(
        Math.round(amount * 100), // Convert to cents
        currency,
        customerId,
        {
          userId: req.userId,
          transactionType: 'deposit'
        },
        { setupFutureUsage: true } // Save card for future use
      );

      res.json({
        success: true,
        data: {
          clientSecret,
          paymentIntentId,
          amount,
          currency
        }
      });
    } catch (stripeError: any) {
      console.warn('Stripe not available, using mock:', stripeError.message);

      // Fallback to mock
      res.json({
        success: true,
        data: {
          clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
          amount,
          currency,
          mock: true
        }
      });
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
});

// GET /api/payments/methods - List saved payment methods
router.get('/methods', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const user = await User.findById(req.userId);

    if (!user || !user.stripeCustomerId) {
      return res.json({ success: true, data: [] });
    }

    try {
      const { getStripeProcessor } = require('../utils/stripe-processor');
      const stripeProcessor = getStripeProcessor();
      const stripe = stripeProcessor.getStripeInstance();

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      const formattedMethods = paymentMethods.data.map((pm: any) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: false // Stripe doesn't have a simple default flag on the list method without checking customer
      }));

      res.json({
        success: true,
        data: formattedMethods
      });
    } catch (stripeError: any) {
      console.error('List payment methods error:', stripeError);
      res.status(500).json({ success: false, error: 'Failed to list payment methods' });
    }
  } catch (error) {
    console.error('List payment methods error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// GET /api/payments/auto-debit - Get auto-debit configuration
router.get('/auto-debit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get auto-debit configuration from user preferences
    const autoDebitConfig = user.preferences?.autoDebit || {
      enabled: false,
      amount: 27.40,
      frequency: 'daily',
      paymentMethodId: null
    };

    res.json({
      success: true,
      data: {
        enabled: autoDebitConfig.enabled || false,
        amount: autoDebitConfig.amount || 27.40,
        frequency: autoDebitConfig.frequency || 'daily',
        paymentMethodId: autoDebitConfig.paymentMethodId || null,
        nextDebitDate: autoDebitConfig.nextDebitDate || new Date()
      }
    });

  } catch (error) {
    console.error('Get auto-debit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto-debit configuration'
    });
  }
});

// POST /api/payments/auto-debit - Setup or update auto-debit
router.post('/auto-debit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { enabled, amount, frequency, paymentMethodId } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate next debit date based on frequency
    let nextDebitDate = new Date();
    if (frequency === 'daily') {
      nextDebitDate.setDate(nextDebitDate.getDate() + 1);
    } else if (frequency === 'weekly') {
      nextDebitDate.setDate(nextDebitDate.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextDebitDate.setMonth(nextDebitDate.getMonth() + 1);
    }

    // Update user preferences
    if (!user.preferences) {
      user.preferences = {};
    }

    user.preferences.autoDebit = {
      enabled: enabled !== undefined ? enabled : true,
      amount: amount || 27.40,
      frequency: frequency || 'daily',
      paymentMethodId: paymentMethodId || null,
      nextDebitDate
    };

    await user.save();

    res.json({
      success: true,
      data: {
        enabled: user.preferences.autoDebit.enabled,
        amount: user.preferences.autoDebit.amount,
        frequency: user.preferences.autoDebit.frequency,
        paymentMethodId: user.preferences.autoDebit.paymentMethodId,
        nextDebitDate: user.preferences.autoDebit.nextDebitDate
      },
      message: enabled ? 'Auto-debit enabled successfully' : 'Auto-debit updated successfully'
    });

  } catch (error) {
    console.error('Setup auto-debit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup auto-debit'
    });
  }
});

// GET /api/payments/receipts - Get all receipts for user
router.get('/receipts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const receipts = await ReceiptService.getUserReceipts(req.userId!, limit, skip);

    res.json({
      success: true,
      data: receipts,
      pagination: {
        page,
        limit,
        hasMore: receipts.length === limit
      }
    });
  } catch (error: any) {
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get receipts'
    });
  }
});

// GET /api/payments/receipts/:receiptNumber - Get specific receipt
router.get('/receipts/:receiptNumber', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const receiptNumber = req.params.receiptNumber as string;
    const receipt = await ReceiptService.getReceiptByNumber(receiptNumber);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    // Verify receipt belongs to user
    if (receipt.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: receipt
    });
  } catch (error: any) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get receipt'
    });
  }
});

// GET /api/payments/receipts/:receiptNumber/html - Get receipt as HTML
router.get('/receipts/:receiptNumber/html', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const receiptNumber = req.params.receiptNumber as string;
    const receipt = await ReceiptService.getReceiptByNumber(receiptNumber);

    if (!receipt) {
      return res.status(404).send('<h1>Receipt not found</h1>');
    }

    // Verify receipt belongs to user
    if (receipt.userId.toString() !== req.userId) {
      return res.status(403).send('<h1>Access denied</h1>');
    }

    const html = ReceiptService.generateReceiptHTML(receipt);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    console.error('Get receipt HTML error:', error);
    res.status(500).send('<h1>Error generating receipt</h1>');
  }
});

// POST /api/payments/:transactionId/retry - Retry failed payment
router.post('/:transactionId/retry', authenticateToken, paymentLimiter, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { transactionId } = req.params;
    const { paymentMethodId } = req.body;

    // Get the failed transaction
    const transaction = await Transaction.findOne({
      transactionId,
      userId: req.userId,
      status: 'failed'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Failed transaction not found'
      });
    }

    // Create new payment intent with Stripe
    try {
      const { getStripeProcessor } = require('../utils/stripe-processor');
      const stripeProcessor = getStripeProcessor();

      const { clientSecret, paymentIntentId } = await stripeProcessor.createPaymentIntent(
        Math.round(transaction.amount * 100), // Convert to cents
        'usd',
        undefined, // customerId
        {
          userId: req.userId,
          transactionType: transaction.type,
          retryOf: transactionId
        }
      );

      // Create new transaction for retry
      const retryTransaction = await Transaction.create({
        userId: req.userId,
        type: transaction.type,
        amount: transaction.amount,
        status: 'pending',
        description: `Retry: ${transaction.description}`,
        paymentMethodId: paymentMethodId,
        externalTransactionId: paymentIntentId,
        metadata: {
          retryOf: transactionId,
          originalTransactionId: transaction._id.toString(),
          stripePaymentIntentId: paymentIntentId
        }
      });

      res.json({
        success: true,
        message: 'Payment retry initiated',
        data: {
          transaction: retryTransaction,
          clientSecret,
          paymentIntentId
        }
      });
    } catch (stripeError: any) {
      console.error('Stripe retry error:', stripeError);
      res.status(500).json({
        success: false,
        error: 'Failed to retry payment',
        message: stripeError.message
      });
    }
  } catch (error: any) {
    console.error('Retry payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retry payment'
    });
  }
});

export default router;
