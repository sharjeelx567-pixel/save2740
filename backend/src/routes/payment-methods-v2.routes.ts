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
        id: m._id,
        type: m.type,
        brand: m.brand,
        last4: m.last4,
        expMonth: m.expMonth,
        expYear: m.expYear,
        isDefault: m.isDefault,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('List payment methods error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment methods' });
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

    return customer.id;
  } catch (error) {
    console.error('Get/create Stripe customer error:', error);
    return null;
  }
}

export default router;
