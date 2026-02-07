import express from 'express';
import { connectDB } from '../config/db';


const router = express.Router();

/**
 * Manual Cron Job Triggers - Development/Testing Only
 * Allows manual execution of cron jobs without waiting for scheduled time
 */

// Only allow in development
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
    /**
     * POST /api/cron-test/daily-savings
     * Manually trigger daily savings automation
     */
    router.post('/daily-savings', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { runDailySavingsScheduledJob } = await import('../utils/daily-savings-automation');

            console.log('🔧 [TEST] Manually triggering daily savings automation...');
            const result = await runDailySavingsScheduledJob();

            res.json({
                success: true,
                message: 'Daily savings automation completed',
                result
            });
        } catch (error: any) {
            console.error('Error running daily savings automation:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/withdrawal-processing
     * Manually trigger withdrawal processing
     */
    router.post('/withdrawal-processing', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { processScheduledWithdrawals } = await import('../utils/withdrawal-automation');

            console.log('🔧 [TEST] Manually triggering withdrawal processing...');
            const result = await processScheduledWithdrawals();

            res.json({
                success: true,
                message: 'Withdrawal processing completed',
                result
            });
        } catch (error: any) {
            console.error('Error running withdrawal processing:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/low-balance-alerts
     * Manually trigger low balance alerts
     */
    router.post('/low-balance-alerts', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { sendLowBalanceAlerts } = await import('../utils/low-balance-alerts');

            console.log('🔧 [TEST] Manually triggering low balance alerts...');
            const result = await sendLowBalanceAlerts();

            res.json({
                success: true,
                message: 'Low balance alerts sent',
                result
            });
        } catch (error: any) {
            console.error('Error sending low balance alerts:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/monthly-reports
     * Manually trigger monthly reports
     */
    router.post('/monthly-reports', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { generateMonthlyReports } = await import('../utils/monthly-reports');

            console.log('🔧 [TEST] Manually triggering monthly reports...');
            const result = await generateMonthlyReports();

            res.json({
                success: true,
                message: 'Monthly reports generated',
                result
            });
        } catch (error: any) {
            console.error('Error generating monthly reports:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/referral-bonuses
     * Manually trigger referral bonus processing
     */
    router.post('/referral-bonuses', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { processReferralBonuses } = await import('../utils/referral-bonus-processor');

            console.log('🔧 [TEST] Manually triggering referral bonus processing...');
            const result = await processReferralBonuses();

            res.json({
                success: true,
                message: 'Referral bonuses processed',
                result
            });
        } catch (error: any) {
            console.error('Error processing referral bonuses:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/funding-reminders
     * Manually trigger weekly funding reminders
     */
    router.post('/funding-reminders', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { sendWeeklyFundingReminders } = await import('../utils/funding-reminders');

            console.log('🔧 [TEST] Manually triggering funding reminders...');
            const result = await sendWeeklyFundingReminders();

            res.json({
                success: true,
                message: 'Funding reminders sent',
                result
            });
        } catch (error: any) {
            console.error('Error sending funding reminders:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/streak-reminders
     * Manually trigger streak recovery reminders
     */
    router.post('/streak-reminders', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { sendStreakRecoveryReminders } = await import('../utils/streak-reminders');

            console.log('🔧 [TEST] Manually triggering streak recovery reminders...');
            const result = await sendStreakRecoveryReminders();

            res.json({
                success: true,
                message: 'Streak recovery reminders sent',
                result
            });
        } catch (error: any) {
            console.error('Error sending streak reminders:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/cleanup
     * Manually trigger session cleanup
     */
    router.post('/cleanup', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { cleanupExpiredData } = await import('../utils/cleanup-service');

            console.log('🔧 [TEST] Manually triggering cleanup...');
            const result = await cleanupExpiredData();

            res.json({
                success: true,
                message: 'Cleanup completed',
                result
            });
        } catch (error: any) {
            console.error('Error running cleanup:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/transaction-sync
     * Manually trigger transaction sync
     */
    router.post('/transaction-sync', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { syncPendingTransactions } = await import('../utils/transaction-sync');

            console.log('🔧 [TEST] Manually triggering transaction sync...');
            const result = await syncPendingTransactions();

            res.json({
                success: true,
                message: 'Transaction sync completed',
                result
            });
        } catch (error: any) {
            console.error('Error syncing transactions:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/group-round-init
     * Manually trigger group round initialization
     */
    router.post('/group-round-init', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { initializeLockedGroups } = await import('../services/group-contribution.service');

            console.log('🔧 [TEST] Manually triggering group round initialization...');
            await initializeLockedGroups();

            res.json({
                success: true,
                message: 'Group round initialization completed'
            });
        } catch (error: any) {
            console.error('Error initializing group rounds:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/cron-test/group-chain-breaks
     * Manually trigger chain break detection
     */
    router.post('/group-chain-breaks', async (req: express.Request, res: express.Response) => {
        try {
            await connectDB();
            const { checkAllGroupsForDueContributions } = await import('../services/group-contribution.service');

            console.log('🔧 [TEST] Manually triggering chain break detection...');
            await checkAllGroupsForDueContributions();

            res.json({
                success: true,
                message: 'Chain break detection completed'
            });
        } catch (error: any) {
            console.error('Error checking chain breaks:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /api/cron-test/status
     * Get status of all cron jobs
     */
    router.get('/status', async (req: express.Request, res: express.Response) => {
        try {
            const { getCronJobsStatus } = await import('../utils/cron-scheduler');
            const status = getCronJobsStatus();

            res.json({
                success: true,
                jobs: status
            });
        } catch (error: any) {
            console.error('Error getting cron status:', error);
            res.status(500).json({ error: error.message });
        }
    });

    console.log('🧪 Cron test endpoints enabled at /api/cron-test');
}

export default router;
