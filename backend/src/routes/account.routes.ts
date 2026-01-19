import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User } from '../models/auth.model';

const router = express.Router();

router.delete('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  // Delete user logic
  res.json({ success: true, message: 'Account scheduled for deletion' });
});

export default router;
