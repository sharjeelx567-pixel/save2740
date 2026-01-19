import express, { Response } from 'express';
import { PaymentMethod } from '../models/payment-method.model';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/banking - List linked bank accounts
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const accounts = await PaymentMethod.find({
      userId: req.userId,
      type: 'bank_account',
      status: 'active'
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

export default router;
