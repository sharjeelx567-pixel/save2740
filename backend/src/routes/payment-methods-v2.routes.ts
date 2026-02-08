/**
 * Payment Methods API v2 - PCI Compliant
 * 
 * FLOW:
 * 1. Frontend calls POST /api/payment-methods/setup-intent
 * 2. Backend creates SetupIntent and returns client_secret
 * 3. Frontend uses Stripe Elements to collect card + confirmCardSetup
 * 4. Frontend calls POST /api/payment-methods/confirm with payment_method_id
 * 5. Backend attaches payment method to customer and saves metadata
 * 
 * NO RAW CARD DATA EVER TOUCHES THIS SERVER
 */

import express, { Response } from 'express';
import Stripe from 'stripe';
import { PaymentMethod } from '../models/payment-method.model';
import { Wallet } from '../models/wallet.model';
import { User } from '../models/auth.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover'
});

/**
 * GET /api/payment-methods
 * List all saved payment methods for the user
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const methods = await PaymentMethod.find({
      userId: req.userId,
      status: 'active'
    }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: methods.map(m => ({
        _id: m._id,
        id: m._id,
        type: m.type,
        brand: m.brand,
        last4: m.last4,
        expMonth: m.expMonth,
        expYear: m.expYear,
        isDefault: m.isDefault,
        createdAt: m.createdAt,
        name: m.name || (m.type === 'card' ? `${m.brand} •••• ${m.last4}` : `Bank •••• ${m.last4}`)
      }))
    });
  } catch (error) {
    console.error('List payment methods error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment methods' });
  }
});

/**
 * POST /api/payment-methods
 * Directly add a payment method (used for bank accounts or legacy card flow)
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { type, bankName, accountNumber, routingNumber, accountType, isDefault = false, name } = req.body;

    if (type !== 'bank_account') {
      return res.status(400).json({ success: false, error: 'Direct POST only supported for bank accounts. Use /setup-intent for cards.' });
    }

    if (!accountNumber || !routingNumber) {
      return res.status(400).json({ success: false, error: 'Account and routing numbers are required' });
    }

    const { getStripeProcessor } = await import('../utils/stripe-processor');
    const stripeProcessor = getStripeProcessor();

    // 1. Tokenize bank details
    const tokenResult = await stripeProcessor.tokenizePaymentMethod({
      type: 'bank_account',
      provider: 'stripe',
      accountNumber,
      routingNumber,
      accountHolderName: name || 'User Account'
    });

    if (!tokenResult.success) {
      return res.status(400).json({ success: false, error: tokenResult.error });
    }

    // 2. Get/Create customer
    const stripeCustomerId = await getOrCreateStripeCustomer(req.userId!);

    if (!stripeCustomerId) {
      return res.status(400).json({ success: false, error: 'Could not create payment profile' });
    }

    // 3. Attach token to customer (this creates a persistent BankAccount or Source)
    const stripe = stripeProcessor.getStripeInstance();
    let sourceId: string;
    let setupIntentId: string | undefined;

    try {

      // Use SetupIntent to attach the PaymentMethod (bypass direct attach restriction for unverified banks)
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method: tokenResult.externalId,
        payment_method_types: ['us_bank_account'],
        confirm: true,
        return_url: 'https://example.com/return', // Placeholder
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

      // If setup intent succeeds or requires action, the PM is attached
      sourceId = tokenResult.externalId;
      setupIntentId = setupIntent.id;
      console.log(`[PaymentMethods] Attached PaymentMethod ${sourceId} to customer ${stripeCustomerId} via SetupIntent ${setupIntentId}`);
    } catch (stripeError: any) {
      if (stripeError.code === 'bank_account_exists' || stripeError.message?.includes('already exists')) {
        console.log(`[PaymentMethods] Bank account already exists for customer ${stripeCustomerId}, retrieving existing PaymentMethod`);

        // List PaymentMethods for this customer
        const pms = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: 'us_bank_account'
        });

        const existingPm = pms.data.find((s: any) =>
          s.us_bank_account?.last4 === tokenResult.last4 &&
          s.us_bank_account?.routing_number === routingNumber
        );

        if (existingPm) {
          sourceId = existingPm.id;
          // Ensure it is attached to THIS customer (idempotent)
          if (existingPm.customer !== stripeCustomerId) {
            try {
              await stripe.paymentMethods.attach(sourceId, { customer: stripeCustomerId });
            } catch (e) { /* ignore already attached */ }
          }
        } else {
          // Fallback: maybe it's a legacy source? 
          const sources = await stripe.customers.listSources(stripeCustomerId, { object: 'bank_account', limit: 100 });
          const existingSource = sources.data.find((s: any) =>
            s.last4 === tokenResult.last4 && s.routing_number === routingNumber
          );
          if (existingSource) {
            sourceId = existingSource.id;
          } else {
            throw stripeError;
          }
        }
      } else {
        throw stripeError;
      }
    }

    // 4. Check for existing internal record to avoid duplicates
    let paymentMethod = await PaymentMethod.findOne({
      userId: req.userId,
      providerId: sourceId,
      status: { $ne: 'deleted' }
    });

    if (paymentMethod) {
      console.log(`[PaymentMethods] Updating existing internal record ${paymentMethod._id}`);
      paymentMethod.status = 'active';
      paymentMethod.isDefault = isDefault;
      paymentMethod.name = name || bankName || paymentMethod.name;
      await paymentMethod.save();
    } else {
      // Create our internal record
      paymentMethod = await PaymentMethod.create({
        userId: req.userId,
        type: 'bank_account',
        provider: 'stripe',
        providerId: sourceId,
        stripePaymentMethodId: sourceId,
        stripeCustomerId: stripeCustomerId,
        brand: bankName || 'Bank Account',
        last4: tokenResult.last4,
        isDefault: isDefault,
        status: 'active',
        name: name || bankName || `Bank Account •••• ${tokenResult.last4}`
      });
    }

    // 5. Auto-verify in test mode
    const isTestMode = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test');
    if (isTestMode && paymentMethod.type === 'bank_account') {
      try {
        console.log(`[PaymentMethods] Auto-verifying bank account ${setupIntentId || sourceId} for test mode`);
        await stripeProcessor.verifyPaymentMethod(setupIntentId || sourceId, stripeCustomerId);
      } catch (verifyError: any) {
        console.warn(`[PaymentMethods] Auto-verification step warning:`, verifyError.message);
      }

      try {
        // Force attach to be sure it is linked to customer
        await stripe.paymentMethods.attach(sourceId, { customer: stripeCustomerId });
        console.log(`[PaymentMethods] Force-attached ${sourceId} to customer ${stripeCustomerId}`);
      } catch (attachError: any) {
        // Ignore "already attached" errors
        if (!attachError.message?.includes('attached to a Customer')) {
          console.warn(`[PaymentMethods] Force-attach failed:`, attachError.message);
        }
      }
    }

    // Handle default status
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.userId, _id: { $ne: paymentMethod._id } },
        { isDefault: false }
      );
    }

    res.status(200).json({
      success: true,
      message: isTestMode ? 'Bank account registered and verified for test' : 'Bank account registered successfully',
      data: paymentMethod
    });

  } catch (error: any) {
    console.error('Add payment method error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to add payment method' });
  }
});

/**
 * POST /api/payment-methods/setup-intent
 * Create a SetupIntent for adding a new payment method
 * 
 * This is STEP 1: Backend creates SetupIntent, returns client_secret
 * Frontend will use this to securely collect card details via Stripe Elements
 */
router.post('/setup-intent', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(req.userId!);

    if (!stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'Could not create payment profile'
      });
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow future payments without user present
      metadata: {
        userId: req.userId!
      }
    });

    console.log(`[PaymentMethods] Created SetupIntent ${setupIntent.id} for user ${req.userId}`);

    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id
      }
    });
  } catch (error: any) {
    console.error('Create setup intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create setup intent'
    });
  }
});

/**
 * POST /api/payment-methods/confirm
 * Confirm and save a payment method after frontend confirms SetupIntent
 * 
 * This is STEP 2: After frontend calls stripe.confirmCardSetup,
 * it sends us the payment_method_id to attach and save
 * 
 * Body: { paymentMethodId: string, isDefault?: boolean }
 */
router.post('/confirm', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const { paymentMethodId, isDefault = true } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID is required'
      });
    }

    // Validate this is a real Stripe payment method
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!stripePaymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method'
      });
    }

    // Get stripe customer ID
    const stripeCustomerId = await getOrCreateStripeCustomer(req.userId!);

    if (!stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'Could not find payment profile'
      });
    }

    // Attach payment method to customer (if not already attached)
    if (stripePaymentMethod.customer !== stripeCustomerId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });
    }

    // Set as default payment method if requested
    if (isDefault) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Also unset default on other saved methods
      await PaymentMethod.updateMany(
        { userId: req.userId, status: 'active' },
        { $set: { isDefault: false } }
      );
    }

    // Check if we already have this payment method saved
    const existingMethod = await PaymentMethod.findOne({
      userId: req.userId,
      stripePaymentMethodId: paymentMethodId
    });

    if (existingMethod) {
      existingMethod.isDefault = isDefault;
      await existingMethod.save();

      return res.json({
        success: true,
        data: {
          _id: existingMethod._id,
          id: existingMethod._id,
          type: existingMethod.type,
          brand: existingMethod.brand,
          last4: existingMethod.last4,
          expMonth: existingMethod.expMonth,
          expYear: existingMethod.expYear,
          isDefault: existingMethod.isDefault
        },
        message: 'Payment method updated'
      });
    }

    // Extract card details (SAFE - only metadata, no sensitive data)
    const card = stripePaymentMethod.card;

    // Save to database
    const savedMethod = await PaymentMethod.create({
      userId: req.userId,
      type: 'card',
      stripePaymentMethodId: paymentMethodId,
      stripeCustomerId: stripeCustomerId,
      brand: card?.brand || 'unknown',
      last4: card?.last4 || '****',
      expMonth: card?.exp_month,
      expYear: card?.exp_year,
      fingerprint: card?.fingerprint, // Useful for detecting duplicate cards
      status: 'active',
      isDefault: isDefault,
      name: `${(card?.brand || 'Card').toUpperCase()} •••• ${card?.last4}`
    });

    console.log(`[PaymentMethods] Saved payment method ${savedMethod._id} for user ${req.userId}`);

    res.status(201).json({
      success: true,
      data: {
        _id: savedMethod._id,
        id: savedMethod._id,
        type: savedMethod.type,
        brand: savedMethod.brand,
        last4: savedMethod.last4,
        expMonth: savedMethod.expMonth,
        expYear: savedMethod.expYear,
        isDefault: savedMethod.isDefault
      },
      message: 'Payment method added successfully'
    });
  } catch (error: any) {
    console.error('Confirm payment method error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save payment method'
    });
  }
});

/**
 * DELETE /api/payment-methods/:id
 * Remove a payment method
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const method = await PaymentMethod.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Detach from Stripe
    if (method.stripePaymentMethodId) {
      try {
        await stripe.paymentMethods.detach(method.stripePaymentMethodId);
      } catch (stripeError) {
        console.warn('Failed to detach from Stripe:', stripeError);
        // Continue with local deletion
      }
    }

    // Soft delete (keep for records)
    method.status = 'deleted';
    await method.save();

    // If was default, set another as default
    if (method.isDefault) {
      const nextMethod = await PaymentMethod.findOne({
        userId: req.userId,
        status: 'active'
      });
      if (nextMethod) {
        nextMethod.isDefault = true;
        await nextMethod.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment method removed'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove payment method' });
  }
});

/**
 * PUT /api/payment-methods/:id/default
 * Set a payment method as default
 */
router.put('/:id/default', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const method = await PaymentMethod.findOne({
      _id: req.params.id,
      userId: req.userId,
      status: 'active'
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Update Stripe default
    if (method.stripeCustomerId && method.stripePaymentMethodId) {
      await stripe.customers.update(method.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: method.stripePaymentMethodId
        }
      });
    }

    // Update database
    await PaymentMethod.updateMany(
      { userId: req.userId, status: 'active' },
      { $set: { isDefault: false } }
    );

    method.isDefault = true;
    await method.save();

    res.json({
      success: true,
      message: 'Default payment method updated'
    });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ success: false, error: 'Failed to update default' });
  }
});

/**
 * Helper: Get or create Stripe customer for user
 */
async function getOrCreateStripeCustomer(userId: string): Promise<string | null> {
  try {
    // Check wallet for existing customer ID
    let wallet = await Wallet.findOne({ userId });

    if (wallet?.stripeCustomerId) {
      // Verify customer still exists in Stripe
      try {
        await stripe.customers.retrieve(wallet.stripeCustomerId);
        return wallet.stripeCustomerId;
      } catch {
        // Customer deleted from Stripe, need to create new one
        console.log(`[PaymentMethods] Stripe customer ${wallet.stripeCustomerId} not found, creating new`);
      }
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[PaymentMethods] User ${userId} not found`);
      return null;
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      metadata: {
        userId: userId,
        platform: 'save2740'
      }
    });

    console.log(`[PaymentMethods] Created Stripe customer ${customer.id} for user ${userId}`);

    // Save to wallet
    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        stripeCustomerId: customer.id
      });
    } else {
      wallet.stripeCustomerId = customer.id;
      await wallet.save();
    }

    // Save to user (already fetched above)
    if (user) {
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    return customer.id;
  } catch (error) {
    console.error('Get/create Stripe customer error:', error);
    return null;
  }
}

export default router;
