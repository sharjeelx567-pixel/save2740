import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/history', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/message', authenticateToken, (req: AuthRequest, res: Response) => {
  // Mock response
  res.json({ success: true, message: 'Message sent' });
});

export default router;
