
import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { FundingSchedule } from '../models/funding-schedule.model';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { connectDB } from '../config/db';

const router = express.Router();

const fundingScheduleSchema = z.object({
    frequency: z.enum(['weekly', 'monthly']),
    amount: z.number().min(1),
    paymentMethodId: z.string().min(1)
});

// GET /api/funding - Get active funding schedule
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const schedule = await FundingSchedule.findOne({
            userId: req.userId,
            status: { $in: ['active', 'paused', 'failed'] }
        });

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch funding schedule' });
    }
});

// POST /api/funding - Create or Update funding schedule
router.post('/', authenticateToken, validate(fundingScheduleSchema), async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { frequency, amount, paymentMethodId } = req.body;

        // Check existing
        let schedule = await FundingSchedule.findOne({ userId: req.userId });

        const now = new Date();
        // specific start date logic if needed (e.g. next Monday), for now starts immediately or next period?
        // "Recommended cadence: Weekly / Monthly". Usually starts immediately or tomorrow.
        // Let's set nextRunDate to NOW so it runs on next script execution, 
        // OR we can say "starts tomorrow".
        // If I set it to now, the cron will pick it up immediately.
        // If user wants to fund "right now", they should use "Manual Top-Up".
        // So schedule should probably start in 1 period? Or start "upcoming"?
        // Typically "Set up weekly deposit" -> First one is today?
        // Let's set nextRunDate to TODAY (allow immediate run if cron runs soon).

        let nextRunDate = new Date(); // Today

        if (schedule) {
            schedule.frequency = frequency;
            schedule.amount = amount;
            schedule.paymentMethodId = paymentMethodId;
            schedule.status = 'active';
            schedule.failureCount = 0; // Reset failures on update
            // Only update nextRunDate if it was in the past or far future and we want to reset? 
            // Or keep existing cycle?
            // If changing amount/frequency, usually reset cycle.
            schedule.nextRunDate = nextRunDate;
            await schedule.save();
        } else {
            schedule = await FundingSchedule.create({
                userId: req.userId,
                frequency,
                amount,
                paymentMethodId,
                nextRunDate,
                status: 'active'
            });
        }

        res.json({
            success: true,
            message: 'Funding schedule updated',
            data: schedule
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update funding schedule' });
    }
});

// POST /api/funding/cancel - Cancel/Pause schedule
router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const schedule = await FundingSchedule.findOne({ userId: req.userId });
        if (schedule) {
            schedule.status = 'paused'; // or delete?
            await schedule.save();
        }
        res.json({ success: true, message: 'Funding schedule paused' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to cancel schedule' });
    }
});

export default router;
