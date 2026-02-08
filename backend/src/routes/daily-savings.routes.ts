import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { amount: 27.4, hour: 9, timezone: 'UTC' } });
});

router.post('/process', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { processDailySavingsForUser } = await import('../utils/daily-savings-automation');
    const { User } = await import('../models/auth.model');

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const result = await processDailySavingsForUser(
      req.userId!,
      user.email,
      user.firstName || 'User'
    );

    if (result.status === 'success') {
      res.json({ success: true, message: result.message, data: result });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    console.error('Manual daily savings process error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to process daily savings' });
  }
});

export default router;
