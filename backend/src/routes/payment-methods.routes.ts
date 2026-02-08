import express, { Response } from 'express';
import { PaymentMethod } from '../models/payment-method.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getStripeProcessor } from '../utils/stripe-processor';
import { User } from '../models/auth.model';

const router = express.Router();

// GET /api/payment-methods - List all methods
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const methods = await PaymentMethod.find({
      userId: req.userId,
      status: 'active'
    }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('List payment methods error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment methods' });
  }
});

// POST /api/payment-methods - Add new payment method (Card or Bank)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { type, cardNumber, expiry, cvc, bankName, accountNumber, routingNumber, accountType, isDefault } = req.body;

    if (!type || (type === 'card' && (!cardNumber || !expiry || !cvc)) ||
      (type === 'bank_account' && (!accountNumber || !routingNumber))) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment method details'
      });
    }

    // If setting as default, unset others
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.userId },
        { $set: { isDefault: false } }
      );
    }

    let providerId: string | undefined;
    let last4: string = '';
    let name: string = '';
    let stripeCustomerId: string | undefined;

    // Process with Stripe
    try {
      const stripeProcessor = getStripeProcessor();

      // Get or create Stripe customer
      const user = await User.findOne({ userId: req.userId });

      if (user) {
        // Check if user has stripeCustomerId in wallet
        const { Wallet } = require('../models/wallet.model');
        const wallet = await Wallet.findOne({ userId: req.userId });
        stripeCustomerId = wallet?.stripeCustomerId;

        if (!stripeCustomerId) {
          stripeCustomerId = await stripeProcessor.createCustomer(
            user.email,
            `${user.firstName} ${user.lastName}`,
            { userId: req.userId }
          );
          // Save to wallet
          if (wallet) {
            wallet.stripeCustomerId = stripeCustomerId;
            await wallet.save();
          }
        }
      }

      if (type === 'card') {
        // Create payment method with Stripe
        const paymentMethod = await stripeProcessor.getStripeInstance().paymentMethods.create({
          type: 'card',
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month: parseInt(expiry.split('/')[0]),
            exp_year: 2000 + parseInt(expiry.split('/')[1]),
            cvc: cvc
          }
        });

        // Attach to customer
        await stripeProcessor.getStripeInstance().paymentMethods.attach(paymentMethod.id, {
          customer: stripeCustomerId
        });

        providerId = paymentMethod.id;
        last4 = paymentMethod.card?.last4 || cardNumber.slice(-4);
        name = `${paymentMethod.card?.brand?.toUpperCase() || 'Card'} •••• ${last4}`;
      } else if (type === 'bank_account') {
        // Create bank account token
        const token = await stripeProcessor.getStripeInstance().tokens.create({
          bank_account: {
            country: 'US',
            currency: 'usd',
            account_holder_name: user ? `${user.firstName} ${user.lastName}` : 'Account Holder',
            account_holder_type: 'individual',
            routing_number: routingNumber,
            account_number: accountNumber
          }
        });

        // Create payment method from token
        const paymentMethod = await stripeProcessor.getStripeInstance().paymentMethods.create({
          type: 'us_bank_account',
          us_bank_account: {
            account_holder_type: 'individual',
            account_type: accountType || 'checking'
          }
        });

        providerId = paymentMethod.id;
        last4 = token.bank_account?.last4 || accountNumber.slice(-4);
        name = bankName || 'Bank Account';
      }
    } catch (stripeError: any) {
      console.warn('Stripe not available, using mock:', stripeError.message);
      // Fallback to mock
      providerId = `mock_${Date.now()}`;
      if (type === 'card') {
        last4 = cardNumber.slice(-4);
        name = `Card •••• ${last4}`;
      } else {
        last4 = accountNumber.slice(-4);
        name = bankName || 'Bank Account';
      }
    }

    const method = await PaymentMethod.create({
      userId: req.userId,
      type: type === 'card' ? 'card' : 'bank_account',
      name,
      last4,
      status: 'active',
      providerId,
      stripePaymentMethodId: providerId, // Store in the newer field too
      stripeCustomerId,
      isDefault: !!isDefault
    });

    res.status(201).json({
      success: true,
      data: method,
      message: 'Payment method added successfully'
    });
  } catch (error: any) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add payment method'
    });
  }
});

// POST /api/payment-methods/:id/default - Set as default
router.post('/:id/default', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Unset all defaults
    await PaymentMethod.updateMany(
      { userId: req.userId },
      { $set: { isDefault: false } }
    );

    // Set this one as default
    const method = await PaymentMethod.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    res.json({
      success: true,
      data: method,
      message: 'Default payment method updated'
    });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update default payment method'
    });
  }
});

// DELETE /api/payment-methods/:id - Remove method
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const method = await PaymentMethod.findOne({ _id: req.params.id, userId: req.userId });
    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Delete from Stripe if providerId exists
    if (method.providerId && method.providerId.startsWith('pm_')) {
      try {
        const stripeProcessor = getStripeProcessor();
        await stripeProcessor.deletePaymentMethod(method.providerId);
      } catch (stripeError) {
        console.warn('Failed to delete from Stripe:', stripeError);
      }
    }

    // Soft delete
    method.status = 'inactive';
    await method.save();

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove payment method'
    });
  }
});

export default router;
