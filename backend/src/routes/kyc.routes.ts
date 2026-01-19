import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/status', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { status: 'pending', level: 1 } });
});

router.post('/submit', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'KYC submitted successfully' });
});

export default router;
