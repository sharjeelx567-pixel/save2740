import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/ticket', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'Support ticket created' });
});

export default router;
