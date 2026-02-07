
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { FundingSchedule } from '../models/funding-schedule.model';
import { LedgerService } from '../services/ledger.service';

const runFundingJob = async () => {
    console.log('Starting Funding Job...');
    try {
        await connectDB();

        const now = new Date();
        const dueSchedules = await FundingSchedule.find({
            status: 'active',
            nextRunDate: { $lte: now }
        });

        console.log(`Found ${dueSchedules.length} due funding schedules.`);

        for (const schedule of dueSchedules) {
            try {
                console.log(`Processing funding for user ${schedule.userId}: $${schedule.amount}`);

                // execute deposit
                await LedgerService.fundWallet(schedule.userId, schedule.amount, schedule.paymentMethodId);

                // Update schedule
                schedule.lastRunDate = now;
                schedule.failureCount = 0;

                // Calculate next run date
                const nextDate = new Date(now);
                if (schedule.frequency === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (schedule.frequency === 'monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                schedule.nextRunDate = nextDate;

                await schedule.save();
                console.log(`[Success] Funded User ${schedule.userId}. Next run: ${nextDate.toISOString()}`);

            } catch (err: any) {
                console.error(`[Failed] Funding for user ${schedule.userId}:`, err.message);

                // Handle failure
                schedule.failureCount += 1;
                schedule.failureReason = err.message;

                // If it fails too many times, pause it
                if (schedule.failureCount >= 3) {
                    schedule.status = 'failed'; // or paused
                    console.warn(`[Paused] Schedule for user ${schedule.userId} paused due to excessive failures.`);
                } else {
                    // Retry tomorrow? Or keep same nextRunDate to retry next script run?
                    // Usually better to retry next run, but maybe add a delay or just leave nextRunDate <= now for immediate retry?
                    // For safety, let's bump it by 1 day to avoid spamming usage if issue persists today
                    const retryDate = new Date(now);
                    retryDate.setDate(retryDate.getDate() + 1);
                    schedule.nextRunDate = retryDate;
                }
                await schedule.save();
            }
        }

        console.log('Funding Job Completed.');
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error in Funding Job:', error);
        process.exit(1);
    }
};

runFundingJob();
