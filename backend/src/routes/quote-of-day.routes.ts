import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/quote-of-day
// Public route usually
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      quote: "Do not save what is left after spending, by spend what is left after saving.",
      author: "Warren Buffett"
    }
  });
});

export default router;
