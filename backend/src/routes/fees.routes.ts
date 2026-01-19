import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { platformFee: 0, processingFee: 0 } });
});

export default router;
