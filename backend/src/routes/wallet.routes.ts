import express, { Response } from 'express';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { depositSchema, withdrawSchema, transactionQuerySchema } from '../schemas/wallet.schema';
import { paymentLimiter } from '../middleware/rate-limiters';
import { getStripeProcessor } from '../utils/stripe-processor';
import { User } from '../models/auth.model';
import crypto from 'crypto';
import { notifyTransactionSuccess, notifyTransactionFailed } from '../utils/notification-service';
import mongoose from 'mongoose';

const router = express.Router();

// In-memory idempotency store (use Redis in production)
const idempotencyStore = new Map<string, { response: any; timestamp: number }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup old idempotency keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour

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
        escrowBalance: 0,
        pendingWithdrawals: 0,
        currentStreak: 0,
        dailySavingAmount: 27.4,
        status: 'active'
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

// GET /api/wallet/transactions/:id - Get specific transaction details
router.get('/transactions/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { id } = req.params;

    const transaction = await Transaction.findOne({
      $or: [
        { _id: id },
        { transactionId: id }
      ],
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction'
    });
  }
});

// GET /api/wallet/transactions - Get transaction history with filtering
router.get('/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const query = transactionQuerySchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      type: req.query.type as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const filter: any = { userId: req.userId };

    if (query.type && query.type !== 'all') {
      filter.type = query.type === 'withdraw' ? { $in: ['withdraw', 'withdrawal'] } : query.type;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        total,
        page: page,
        pageSize: limit,
        hasMore: skip + transactions.length < total
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

// GET /api/wallet/transactions/pending - Get pending transactions
router.get('/transactions/pending', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const transactions = await Transaction.find({
      userId: req.userId,
      status: 'pending'
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Get pending transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending transactions'
    });
  }
});

// GET /api/wallet/transactions/failed - Get failed transactions
router.get('/transactions/failed', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const transactions = await Transaction.find({
      userId: req.userId,
      status: 'failed'
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Get failed transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get failed transactions'
    });
  }
});

// POST /api/wallet/deposit - Add money to wallet with Stripe
router.post('/deposit', authenticateToken, paymentLimiter, validate(depositSchema), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { amount, paymentMethodId, currency = 'usd' } = req.body;

    // Check if deposits are globally paused
    const { areContributionsPaused, isMaintenanceMode } = await import('../utils/config-utils');
    if (await areContributionsPaused() || await isMaintenanceMode()) {
      return res.status(503).json({
        success: false,
        error: 'System is currently undergoing maintenance. Deposits are temporarily paused.'
      });
    }

    // Idempotency check - prevent replay attacks
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const cached = idempotencyStore.get(`deposit:${req.userId}:${idempotencyKey}`);
      if (cached) {
        console.log('[Wallet] Returning cached response for idempotency key:', idempotencyKey);
        return res.json(cached.response);
      }
    }

    // Check wallet status
    let wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.userId,
        balance: 0,
        availableBalance: 0,
        locked: 0,
        lockedInPockets: 0,
        referralEarnings: 0,
        escrowBalance: 0,
        pendingWithdrawals: 0,
        currentStreak: 0,
        dailySavingAmount: 27.4,
        status: 'active'
      });
    }

    if (wallet.status === 'frozen' || wallet.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: `Wallet is ${wallet.status}. Cannot process deposits.`,
        freezeReason: wallet.freezeReason
      });
    }

    // Check daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDeposits = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: 'deposit',
          createdAt: { $gte: today },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayTotal = todayDeposits[0]?.total || 0;
    const dailyLimit = 5000;

    if (todayTotal + amount > dailyLimit) {
      return res.status(400).json({
        success: false,
        error: `Daily deposit limit exceeded. Remaining: $${dailyLimit - todayTotal}`
      });
    }

    // Check monthly limits
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyDeposits = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: 'deposit',
          createdAt: { $gte: monthStart },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyTotal = monthlyDeposits[0]?.total || 0;
    const monthlyLimit = 50000;

    if (monthlyTotal + amount > monthlyLimit) {
      return res.status(400).json({
        success: false,
        error: `Monthly deposit limit exceeded. Remaining: $${monthlyLimit - monthlyTotal}`
      });
    }

    // Process with Stripe if available
    let stripePaymentIntentId: string | undefined;
    let clientSecret: string | undefined;
    let transactionStatus: 'pending' | 'completed' | 'failed' = 'pending';
    let requiresAction = false;

    // Scoped for catch block auto-retry
    let stripeProcessor: any;
    let effectivePaymentMethodId: string | undefined;
    let stripeCustomerId: string | null | undefined;

    try {
      stripeProcessor = getStripeProcessor();

      // Look up the saved payment method to get stripePaymentMethodId
      const { PaymentMethod } = await import('../models/payment-method.model');
      const savedPaymentMethod = await PaymentMethod.findOne({
        _id: paymentMethodId,
        userId: req.userId,
        status: 'active'
      });

      if (!savedPaymentMethod || (!savedPaymentMethod.stripePaymentMethodId && !savedPaymentMethod.providerId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment method. Please add a new card.'
        });
      }

      effectivePaymentMethodId = savedPaymentMethod.stripePaymentMethodId || savedPaymentMethod.providerId;

      // Get or create Stripe customer
      stripeCustomerId = wallet.stripeCustomerId || savedPaymentMethod.stripeCustomerId;
      if (!stripeCustomerId) {
        const user = await User.findOne({ userId: req.userId });
        if (user) {
          stripeCustomerId = await stripeProcessor.createCustomer(
            user.email,
            `${user.firstName} ${user.lastName}`,
            { userId: req.userId }
          );
          wallet.stripeCustomerId = stripeCustomerId;
          await wallet.save();
        }
      }

      // Create and confirm payment intent with saved payment method
      const amountInCents = Math.round(amount * 100);
      const { clientSecret: secret, paymentIntentId } = await stripeProcessor.createPaymentIntent(
        amountInCents,
        currency,
        stripeCustomerId,
        {
          userId: req.userId,
          transactionType: 'deposit',
          walletId: wallet._id.toString()
        },
        {
          paymentMethodId: effectivePaymentMethodId
        }
      );

      stripePaymentIntentId = paymentIntentId;
      clientSecret = secret;

      // Check if 3DS is required
      const stripe = stripeProcessor.getStripeInstance();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'requires_action') {
        requiresAction = true;
        transactionStatus = 'pending';
      } else if (paymentIntent.status === 'succeeded') {
        transactionStatus = 'completed';
      } else {
        transactionStatus = 'pending';
      }

    } catch (stripeError: any) {
      // HANDLE UNVERIFIED/DETACHED BANK ACCOUNT IN TEST MODE (Auto-retry)
      const isTestMode = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test');
      const errorMsg = stripeError.message?.toLowerCase() || '';
      const isNotVerifiedError = errorMsg.includes('not verified');
      const isNotAttachedError = errorMsg.includes('attach it to a customer') || errorMsg.includes('provided paymentmethod cannot be attached'); // Stripe error phrasing

      if (isTestMode && (isNotVerifiedError || isNotAttachedError) && stripeCustomerId && effectivePaymentMethodId) {
        try {
          console.log(`[Wallet Deposit] Auto-repairing bank account ${effectivePaymentMethodId} (Verified/Attached) and retrying...`);

          const stripe = stripeProcessor.getStripeInstance();

          // 1. Ensure attached (us_bank_account requires SetupIntent, NOT direct attach)
          try {
            await stripe.setupIntents.create({
              customer: stripeCustomerId,
              payment_method: effectivePaymentMethodId,
              payment_method_types: ['us_bank_account'],
              confirm: true,
              mandate_data: {
                customer_acceptance: {
                  type: 'online',
                  online: {
                    ip_address: req.ip || '127.0.0.1',
                    user_agent: req.headers['user-agent'] || 'Save2740-App'
                  },
                },
              },
            });
            console.log(`[Wallet Deposit] Attached ${effectivePaymentMethodId} via SetupIntent`);
          } catch (e: any) {
            // Ignore "already attached" errors
            if (!e.message?.includes('already attached') && !e.message?.includes('attached to a customer')) {
              console.log('Auto-attach step warning:', e.message);
            }
          }

          // 2. Ensure verified (idempotent-ish via our processor)
          try {
            await stripeProcessor.verifyPaymentMethod(effectivePaymentMethodId, stripeCustomerId);
          } catch (e: any) { console.log('Auto-verify step warning:', e.message); }

          // Retry Create Payment Intent
          const amountInCents = Math.round(amount * 100);
          const retryResult = await stripeProcessor.createPaymentIntent(
            amountInCents,
            currency,
            stripeCustomerId,
            {
              userId: req.userId,
              transactionType: 'deposit',
              walletId: wallet._id.toString(),
              autoVerified: 'true'
            },
            {
              paymentMethodId: effectivePaymentMethodId
            }
          );

          stripePaymentIntentId = retryResult.paymentIntentId;
          clientSecret = retryResult.clientSecret;
          transactionStatus = 'completed'; // If it succeeds now, it's usually instant in test

          console.log(`[Wallet Deposit] Retry successful for PI ${stripePaymentIntentId}`);
          // Continue to transaction creation
        } catch (retryError: any) {
          console.error('[Wallet Deposit] Retry failed:', retryError.message);
          return res.status(400).json({
            success: false,
            error: `Bank account repair failed: ${retryError.message}`
          });
        }
      } else {
        console.warn('Stripe error:', stripeError.message);
        return res.status(400).json({
          success: false,
          error: stripeError.message || 'Payment processing failed'
        });
      }
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'deposit',
      amount: amount,
      status: transactionStatus,
      description: 'Wallet Deposit',
      paymentMethodId: paymentMethodId || 'manual',
      externalTransactionId: stripePaymentIntentId,
      metadata: {
        currency: currency,
        source: 'wallet_deposit',
        clientSecret: clientSecret
      }
    });

    // If mock/instant, update wallet immediately
    if (transactionStatus === 'completed') {
      wallet.balance += amount;
      wallet.availableBalance += amount;
      await wallet.save();
      transaction.completedAt = new Date();
      await transaction.save();

      // Notify user of successful deposit
      await notifyTransactionSuccess(req.userId!, transaction._id.toString(), amount);
    }

    const responseData = {
      success: true,
      message: transactionStatus === 'completed'
        ? `Successfully deposited $${amount}`
        : 'Payment intent created. Please confirm payment.',
      data: {
        wallet,
        transaction,
        clientSecret, // For Stripe confirmation (only needed for 3DS)
        requiresAction: requiresAction
      }
    };

    // Store idempotency response
    if (idempotencyKey) {
      idempotencyStore.set(`deposit:${req.userId}:${idempotencyKey}`, {
        response: responseData,
        timestamp: Date.now()
      });
    }

    res.json(responseData);
  } catch (error: any) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deposit'
    });
  }
});

// POST /api/wallet/deposit/confirm - Confirm deposit robustly
router.post('/deposit/confirm', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, error: 'Payment Intent ID is required' });
    }

    console.log(`[Deposit Confirm] Checking ${paymentIntentId} for user ${req.userId}`);

    // 1. Fetch from Stripe properly
    const stripeProcessor = getStripeProcessor();
    const stripe = stripeProcessor.getStripeInstance();

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (e: any) {
      return res.status(404).json({ success: false, error: 'Stripe PaymentIntent not found' });
    }

    // 2. Security Check: Ensure this payment belongs to the user
    // We check metadata first, or fall back to finding a local transaction that matches, 
    // OR matches the wallet's attached Stripe Customer ID (handling DB resets).
    const paymentUserId = paymentIntent.metadata?.userId;
    const wallet = await Wallet.findOne({ userId: req.userId });

    // Attempt to find local transaction
    let transaction = await Transaction.findOne({
      externalTransactionId: paymentIntentId
    });

    const isMetadataMatch = paymentUserId === req.userId;
    const isCustomerMatch = wallet && wallet.stripeCustomerId && (
      typeof paymentIntent.customer === 'string' ? paymentIntent.customer === wallet.stripeCustomerId :
        (paymentIntent.customer as any)?.id === wallet.stripeCustomerId
    );
    const isTransactionMatch = transaction && transaction.userId === req.userId;

    // Reject if unauthorized
    if (!transaction && !isMetadataMatch && !isCustomerMatch) {
      console.warn(`[Deposit 403] Authorization Failed. 
          Req User: ${req.userId}
          Meta User: ${paymentUserId}
          Stripe Cust: ${typeof paymentIntent.customer === 'string' ? paymentIntent.customer : (paymentIntent.customer as any)?.id}
          Wallet Cust: ${wallet?.stripeCustomerId}
       `);
      return res.status(403).json({ success: false, error: 'Payment does not belong to this user (Metadata/Customer mismatch)' });
    }

    if (transaction && !isTransactionMatch) {
      return res.status(403).json({ success: false, error: 'Transaction belongs to another user' });
    }

    // 3. Handle Succeeded State
    if (paymentIntent.status === 'succeeded') {
      const amount = paymentIntent.amount / 100; // Convert cents to dollars

      // If transaction exists and is already completed, we are done
      if (transaction && transaction.status === 'completed') {
        return res.json({
          success: true,
          message: 'Transaction already completed',
          data: { transaction }
        });
      }

      // Use a transaction/lock to ensure we don't double credit
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Refetch transaction inside lock
        if (transaction) {
          transaction = await Transaction.findById(transaction._id).session(session);
          if (transaction?.status === 'completed') {
            await session.commitTransaction();
            return res.json({ success: true, message: 'Already completed' });
          }
        } else {
          // Recover: Create missing transaction record from Stripe data
          console.log(`[Deposit Confirm] Recovering missing transaction for ${paymentIntentId}`);
          transaction = new Transaction({
            userId: req.userId,
            type: 'deposit',
            amount: amount,
            status: 'pending', // Will update to completed below
            description: 'Wallet Deposit (Recovered)',
            paymentMethodId: paymentIntent.payment_method as string || 'manual',
            externalTransactionId: paymentIntentId,
            metadata: paymentIntent.metadata
          });
        }

        // Update Transaction
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        await transaction.save({ session });

        // Update Wallet
        if (wallet) {
          wallet.balance += amount;
          wallet.availableBalance += amount;
          await wallet.save({ session });
        } else {
          // Should not happen, but safeguard
          await Wallet.create([{
            userId: req.userId,
            balance: amount,
            availableBalance: amount,
            status: 'active'
          }], { session });
        }

        await session.commitTransaction();
        console.log(`[Deposit Confirm] Success: Credited $${amount} to ${req.userId}`);

        // Notify outside transaction
        try {
          await notifyTransactionSuccess(req.userId!, transaction._id.toString(), amount);
        } catch (err) { console.error("Notification failed", err); }

        return res.json({
          success: true,
          message: 'Deposit confirmed and wallet updated',
          data: {
            transaction,
            walletBalance: wallet ? wallet.balance + amount : amount // Optimistic return
          }
        });

      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }

    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }
      return res.json({ success: false, error: `Payment status: ${paymentIntent.status}` });
    } else {
      return res.json({
        success: false,
        status: paymentIntent.status,
        message: 'Payment not yet succeeded'
      });
    }

  } catch (error: any) {
    console.error('Deposit confirmation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to confirm deposit' });
  }
});

// POST /api/wallet/sync - Manual sync for pending transactions
router.post('/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // ---------------------------------------------------------
    // NUCLEAR OPTION: DEEP SCAN STRIPE HISTORY
    // ---------------------------------------------------------
    const stripeProcessor = getStripeProcessor();
    const stripe = stripeProcessor.getStripeInstance();

    // Get customer ID
    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet || !wallet.stripeCustomerId) {
      // If no wallet or no stripe ID, we can't scan stripe. 
      // Just return what we found from pending (which is 0 here)
      return res.json({ success: true, message: 'No Stripe customer linked yet' });
    }

    // List recent successful payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      customer: wallet.stripeCustomerId,
      limit: 10, // Check last 10 payments
    });

    let recoveredCount = 0;
    const session = await mongoose.startSession();

    try {
      for (const pi of paymentIntents.data) {
        if (pi.status === 'succeeded') {
          // Check if we have this transaction
          const existingTx = await Transaction.findOne({
            externalTransactionId: pi.id
          });

          if (!existingTx) {
            console.log(`[Sync] Found missing Stripe deposit: ${pi.id} for $${pi.amount / 100}`);

            // Create missing transaction
            session.startTransaction();
            try {
              const amount = pi.amount / 100;

              const newTx = new Transaction({
                userId: req.userId,
                type: 'deposit',
                amount: amount,
                status: 'completed',
                description: 'Wallet Deposit (Recovered via Sync)',
                paymentMethodId: (pi.payment_method as string) || 'card',
                externalTransactionId: pi.id,
                metadata: pi.metadata,
                completedAt: new Date(pi.created * 1000) // Use Stripe time
              });
              await newTx.save({ session });

              // Credit wallet
              const w = await Wallet.findOne({ userId: req.userId }).session(session);
              if (w) {
                w.balance += amount;
                w.availableBalance += amount;
                await w.save({ session });
              }

              await session.commitTransaction();
              recoveredCount++;

              // Fire notification
              notifyTransactionSuccess(req.userId!, newTx._id.toString(), amount).catch(console.error);

            } catch (err) {
              await session.abortTransaction();
              console.error(`[Sync] Failed to recover ${pi.id}:`, err);
            }
          } else if (existingTx.status === 'pending') {
            // Fix pending state
            existingTx.status = 'completed';
            existingTx.completedAt = new Date();
            await existingTx.save();

            // Update wallet (careful not to double credit if logic was weird, but pending implies not credited)
            // We assume pending means not credited yet.
            wallet.balance += existingTx.amount;
            wallet.availableBalance += existingTx.amount;
            await wallet.save();
            recoveredCount++;
          }
        }
      }
    } finally {
      session.endSession();
    }

    return res.json({
      success: true,
      message: `Synced. Recovered ${recoveredCount} transactions from Stripe.`,
      recovered: recoveredCount
    });

  } catch (error: any) {
    console.error('Wallet sync error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync wallet' });
  }
});

// POST /api/wallet/withdraw - Withdraw money from wallet with Stripe
router.post('/withdraw', authenticateToken, paymentLimiter, validate(withdrawSchema), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { amount, paymentMethodId, reason } = req.body;

    // Check if payouts are globally paused
    const { arePayoutsPaused, isMaintenanceMode } = await import('../utils/config-utils');
    if (await arePayoutsPaused() || await isMaintenanceMode()) {
      return res.status(503).json({
        success: false,
        error: 'System is currently undergoing maintenance. Withdrawals are temporarily paused.'
      });
    }

    // Idempotency check - prevent replay/double withdrawal
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const cached = idempotencyStore.get(`withdraw:${req.userId}:${idempotencyKey}`);
      if (cached) {
        console.log('[Wallet] Returning cached response for withdrawal idempotency key:', idempotencyKey);
        return res.json(cached.response);
      }
    }

    // Use findOneAndUpdate with version check for optimistic locking
    // This prevents race conditions in concurrent withdrawal attempts
    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Check wallet status
    if (wallet.status === 'frozen' || wallet.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: `Wallet is ${wallet.status}. Cannot process withdrawals.`,
        freezeReason: wallet.freezeReason
      });
    }

    // Check available balance
    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient available balance'
      });
    }

    // Check daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWithdrawals = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: { $in: ['withdraw', 'withdrawal'] },
          createdAt: { $gte: today },
          status: { $in: ['completed', 'pending'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayTotal = todayWithdrawals[0]?.total || 0;
    const dailyLimit = 1000;

    if (todayTotal + amount > dailyLimit) {
      return res.status(400).json({
        success: false,
        error: `Daily withdrawal limit exceeded. Remaining: $${dailyLimit - todayTotal}`
      });
    }

    // Atomic balance deduction with optimistic locking
    // This ensures concurrent withdrawals don't overdraw the account
    const walletVersion = wallet.__v;
    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        userId: req.userId,
        availableBalance: { $gte: amount },
        __v: walletVersion // Version check for optimistic locking
      },
      {
        $inc: {
          availableBalance: -amount,
          pendingWithdrawals: amount
        },
        $set: { __v: walletVersion + 1 }
      },
      { new: true }
    );

    if (!updatedWallet) {
      // Concurrent modification or insufficient balance
      return res.status(409).json({
        success: false,
        error: 'Concurrent modification detected or insufficient balance. Please try again.'
      });
    }

    // Create transaction as pending
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'withdrawal',
      amount: amount,
      status: 'pending',
      description: reason || 'Wallet Withdrawal',
      paymentMethodId: paymentMethodId,
      metadata: {
        reason,
        requestedAt: new Date()
      }
    });

    // Process withdrawal via Stripe (async or sync depending on implementation)
    try {
      const stripeProcessor = getStripeProcessor();

      const { PaymentMethod } = await import('../models/payment-method.model');
      const paymentMethod = await PaymentMethod.findOne({
        _id: paymentMethodId,
        userId: req.userId
      });

      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Simulate processing or call real API
      const payoutResult = await stripeProcessor.createPayout(
        amount,
        'usd',
        paymentMethod.stripePaymentMethodId || paymentMethod.providerId, // destination fallback
        {
          userId: req.userId,
          transactionId: transaction._id.toString()
        }
      );

      if (payoutResult.success) {
        // Update transaction to completed after processing
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.externalTransactionId = payoutResult.payoutId;
        await transaction.save();

        // Update wallet - use findOneAndUpdate for atomicity
        await Wallet.findOneAndUpdate(
          { userId: req.userId },
          {
            $inc: {
              balance: -amount,
              pendingWithdrawals: -amount
            }
          }
        );
      } else {
        // Failed payout
        throw new Error(payoutResult.error || 'Payout failed');
      }

    } catch (stripeError: any) {
      console.warn('Stripe withdrawal processing error:', stripeError.message);
      // If payout failed, revert the pending withdrawal and refund available balance?
      // Or keep as pending/failed for review? Usually failed.

      transaction.status = 'failed';
      transaction.metadata = { ...transaction.metadata, error: stripeError.message };
      await transaction.save();

      // Refund the wallet (revert the deduction)
      await Wallet.findOneAndUpdate(
        { userId: req.userId },
        {
          $inc: {
            availableBalance: amount, // refund available balance
            pendingWithdrawals: -amount // remove from pending
          },
          $set: { __v: walletVersion + 2 } // increment version again? Or just +1 from original
        }
      );

      return res.status(400).json({
        success: false,
        error: stripeError.message || 'Withdrawal processing failed'
      });
    }

    const responseData = {
      success: true,
      message: `Withdrawal of $${amount} initiated successfully`,
      data: {
        wallet: updatedWallet,
        transaction
      }
    };

    // Store idempotency response
    if (idempotencyKey) {
      idempotencyStore.set(`withdraw:${req.userId}:${idempotencyKey}`, {
        response: responseData,
        timestamp: Date.now()
      });
    }

    res.json(responseData);
  } catch (error: any) {
    console.error('Withdraw error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to withdraw'
    });
  }
});

// GET /api/wallet/limits - Get wallet transaction limits
router.get('/limits', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get today's deposits
    const todayDeposits = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: 'deposit',
          createdAt: { $gte: today },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get today's withdrawals
    const todayWithdrawals = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: { $in: ['withdraw', 'withdrawal'] },
          createdAt: { $gte: today },
          status: { $in: ['completed', 'pending'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get monthly deposits
    const monthlyDeposits = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: 'deposit',
          createdAt: { $gte: monthStart },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get monthly withdrawals
    const monthlyWithdrawals = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: { $in: ['withdraw', 'withdrawal'] },
          createdAt: { $gte: monthStart },
          status: { $in: ['completed', 'pending'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const limits = {
      daily: {
        deposit: {
          limit: 5000,
          used: todayDeposits[0]?.total || 0,
          remaining: 5000 - (todayDeposits[0]?.total || 0)
        },
        withdrawal: {
          limit: 1000,
          used: todayWithdrawals[0]?.total || 0,
          remaining: 1000 - (todayWithdrawals[0]?.total || 0)
        }
      },
      monthly: {
        deposit: {
          limit: 50000,
          used: monthlyDeposits[0]?.total || 0,
          remaining: 50000 - (monthlyDeposits[0]?.total || 0)
        },
        withdrawal: {
          limit: 10000,
          used: monthlyWithdrawals[0]?.total || 0,
          remaining: 10000 - (monthlyWithdrawals[0]?.total || 0)
        }
      },
      singleTransaction: {
        minDeposit: 1,
        maxDeposit: 10000,
        minWithdrawal: 10,
        maxWithdrawal: 50000
      }
    };

    res.json({ success: true, data: limits });
  } catch (error) {
    console.error('Get wallet limits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch limits'
    });
  }
});

// GET /api/wallet/transactions/export/csv - Export transactions to CSV
router.get('/transactions/export/csv', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { startDate, endDate, type } = req.query;

    const filter: any = { userId: req.userId };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const csvHeader = 'Transaction ID,Date,Type,Amount,Status,Description\n';
    const csvRows = transactions.map(t => {
      const date = new Date(t.createdAt).toLocaleString();
      return `"${t.transactionId}","${date}","${t.type}","${t.amount}","${t.status}","${t.description}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export transactions'
    });
  }
});

// GET /api/wallet/escrow - Get escrow balance
router.get('/escrow', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Get escrow transactions
    const escrowTransactions = await Transaction.find({
      userId: req.userId,
      type: { $in: ['deposit', 'transfer'] },
      status: 'pending',
      'metadata.isEscrow': true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        escrowBalance: wallet.escrowBalance || 0,
        transactions: escrowTransactions
      }
    });
  } catch (error) {
    console.error('Get escrow balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get escrow balance'
    });
  }
});

// POST /api/wallet/freeze - Freeze wallet (admin only, but included for completeness)
router.post('/freeze', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { reason } = req.body;
    const wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    wallet.status = 'frozen';
    wallet.freezeReason = reason || 'Wallet frozen by user request';
    wallet.freezeDate = new Date();
    await wallet.save();

    res.json({
      success: true,
      message: 'Wallet has been frozen',
      data: wallet
    });
  } catch (error) {
    console.error('Freeze wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to freeze wallet'
    });
  }
});

// POST /api/wallet/unfreeze - Unfreeze wallet
router.post('/unfreeze', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    if (wallet.status !== 'frozen') {
      return res.status(400).json({
        success: false,
        error: 'Wallet is not frozen'
      });
    }

    wallet.status = 'active';
    wallet.freezeReason = undefined;
    wallet.freezeDate = undefined;
    wallet.frozenBy = undefined;
    await wallet.save();

    res.json({
      success: true,
      message: 'Wallet has been unfrozen',
      data: wallet
    });
  } catch (error) {
    console.error('Unfreeze wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfreeze wallet'
    });
  }
});

// POST /api/wallet/transactions/:id/cancel - Cancel a pending transaction
router.post('/transactions/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { id } = req.params;

    const transaction = await Transaction.findOne({
      $or: [{ _id: id }, { transactionId: id }],
      userId: req.userId,
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Pending transaction not found'
      });
    }

    // Only pending transactions can be cancelled
    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending transactions can be cancelled'
      });
    }

    // If it's a withdrawal, restore the locked amount
    if (transaction.type === 'withdrawal' || transaction.type === 'withdraw') {
      await Wallet.findOneAndUpdate(
        { userId: req.userId },
        {
          $inc: {
            availableBalance: transaction.amount,
            pendingWithdrawals: -transaction.amount
          }
        }
      );
    }

    // Update transaction status
    transaction.status = 'cancelled';
    transaction.metadata = {
      ...transaction.metadata,
      cancelledAt: new Date(),
      cancelReason: req.body.reason || 'User cancelled'
    };
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel transaction'
    });
  }
});

// POST /api/wallet/transactions/:id/retry - Retry a failed transaction
router.post('/transactions/:id/retry', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { id } = req.params;

    const transaction = await Transaction.findOne({
      $or: [{ _id: id }, { transactionId: id }],
      userId: req.userId,
      status: 'failed'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Failed transaction not found'
      });
    }

    // Check retry limit
    const retries = transaction.metadata?.retries || 0;
    const maxRetries = 3;

    if (retries >= maxRetries) {
      return res.status(400).json({
        success: false,
        error: 'Maximum retry attempts reached. Please contact support.'
      });
    }

    // For deposits, create a new transaction attempt
    if (transaction.type === 'deposit') {
      // Create new pending transaction
      const newTransaction = await Transaction.create({
        userId: req.userId,
        type: 'deposit',
        amount: transaction.amount,
        status: 'pending',
        description: `Retry: ${transaction.description}`,
        paymentMethodId: transaction.paymentMethodId,
        metadata: {
          ...transaction.metadata,
          originalTransactionId: transaction.transactionId,
          retries: retries + 1,
          retriedAt: new Date()
        }
      });

      // Mark original as retried
      transaction.metadata = {
        ...transaction.metadata,
        retriedTransactionId: newTransaction.transactionId
      };
      await transaction.save();

      res.json({
        success: true,
        message: 'Deposit retry initiated',
        data: newTransaction
      });
    } else if (transaction.type === 'withdrawal' || transaction.type === 'withdraw') {
      // For withdrawals, check balance and re-initiate
      const wallet = await Wallet.findOne({ userId: req.userId });

      if (!wallet || wallet.availableBalance < transaction.amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance to retry withdrawal'
        });
      }

      if (wallet.status === 'frozen' || wallet.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: `Wallet is ${wallet.status}. Cannot retry withdrawal.`
        });
      }

      // Lock funds again
      await Wallet.findOneAndUpdate(
        { userId: req.userId },
        {
          $inc: {
            availableBalance: -transaction.amount,
            pendingWithdrawals: transaction.amount
          }
        }
      );

      // Create new pending withdrawal
      const newTransaction = await Transaction.create({
        userId: req.userId,
        type: 'withdrawal',
        amount: transaction.amount,
        status: 'pending',
        description: `Retry: ${transaction.description}`,
        paymentMethodId: transaction.paymentMethodId,
        metadata: {
          ...transaction.metadata,
          originalTransactionId: transaction.transactionId,
          retries: retries + 1,
          retriedAt: new Date()
        }
      });

      transaction.metadata = {
        ...transaction.metadata,
        retriedTransactionId: newTransaction.transactionId
      };
      await transaction.save();

      res.json({
        success: true,
        message: 'Withdrawal retry initiated',
        data: newTransaction
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Transaction type cannot be retried'
      });
    }
  } catch (error) {
    console.error('Retry transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry transaction'
    });
  }
});

export default router;
