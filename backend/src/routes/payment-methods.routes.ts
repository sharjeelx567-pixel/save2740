import express, { Response } from 'express';
import { PaymentMethod } from '../models/payment-method.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// POST /api/payment-methods - Add new method (Mocked)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { type, name, last4, isDefault } = req.body;

    if (!type || !name || !last4) {
      return res.status(400).json({ error: 'Missing details' });
    }

    // If default, unset others
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.userId },
        { $set: { isDefault: false } }
      );
    }

    const method = await PaymentMethod.create({
      userId: req.userId,
      type,
      name,
      last4,
      isDefault: !!isDefault,
      providerId: `mock_${Date.now()}` // Mock Stripe ID
    });

    res.status(201).json({
      success: true,
      data: method
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// DELETE /api/payment-methods/:id - Remove method
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    await PaymentMethod.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'inactive' }
    );
    res.json({ success: true, message: 'Removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

export default router;
