/**
 * Compliance & platform disclaimer (no auth required for public disclaimer)
 */
import express, { Response } from 'express';
import { COMPLIANCE, FUNDING_CADENCE, DAILY_SAVINGS_AMOUNT } from '../config/payment-architecture';

const router = express.Router();

/** GET /api/compliance/disclaimer - Public platform disclaimer and funding info */
router.get('/disclaimer', (_req, res: Response) => {
  res.json({
    success: true,
    data: {
      platformDisclaimer: COMPLIANCE.PLATFORM_DISCLAIMER,
      fundingCadence: {
        weeklyAmount: FUNDING_CADENCE.WEEKLY_AMOUNT,
        monthlyAmount: FUNDING_CADENCE.MONTHLY_AMOUNT,
        dailySavingsAmount: DAILY_SAVINGS_AMOUNT,
      },
    },
  });
});

export default router;
