import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { amount: 27.4, hour: 9, timezone: 'UTC' } });
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'Configuration updated' });
});

export default router;
