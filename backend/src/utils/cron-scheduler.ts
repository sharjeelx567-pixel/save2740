/**
 * Cron Scheduler Configuration
 * Handles all automated tasks for Save2740
 * 
 * Schedule:
 * - Daily Savings: Midnight (00:00) every day
 * - Withdrawal Processing: 2 AM every day
 * - Low Balance Alerts: 10 AM every day
 * - Monthly Reports: 1st of every month at 9 AM
 */

import cron from 'node-cron';
import { runDailySavingsScheduledJob } from '../utils/daily-savings-automation';
import { processScheduledWithdrawals } from '../utils/withdrawal-automation';
import { sendLowBalanceAlerts } from '../utils/low-balance-alerts';
import { generateMonthlyReports } from '../utils/monthly-reports';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
    console.log('📅 [CRON] Initializing cron jobs...\n');

    // ========================================
    // 1. DAILY SAVINGS AUTOMATION
    // ========================================
    // Runs at midnight (00:00) every day
    // Processes internal ledger allocations for all users
    cron.schedule('0 0 * * *', async () => {
        try {
            await runDailySavingsScheduledJob();
        } catch (error) {
            console.error('❌ [CRON] Daily savings automation failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'daily-savings-automation',
    });
    console.log('✅ Daily Savings Automation: Scheduled for 00:00 (midnight) daily');

    // ========================================
    // 2. WITHDRAWAL PROCESSING
    // ========================================
    // Runs at 2 AM every day
    // Processes scheduled withdrawals and ACH payouts
    cron.schedule('0 2 * * *', async () => {
        try {
            await processScheduledWithdrawals();
        } catch (error) {
            console.error('❌ [CRON] Withdrawal processing failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'withdrawal-processing',
    });
    console.log('✅ Withdrawal Processing: Scheduled for 02:00 AM daily');

    // ========================================
    // 3. LOW BALANCE ALERTS
    // ========================================
    // Runs at 10 AM every day
    // Sends proactive alerts to users with low wallet balance
    cron.schedule('0 10 * * *', async () => {
        try {
            await sendLowBalanceAlerts();
        } catch (error) {
            console.error('❌ [CRON] Low balance alerts failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'low-balance-alerts',
    });
    console.log('✅ Low Balance Alerts: Scheduled for 10:00 AM daily');

    // ========================================
    // 4. MONTHLY REPORTS
    // ========================================
    // Runs on 1st of every month at 9 AM
    // Generates and sends monthly savings reports
    cron.schedule('0 9 1 * *', async () => {
        try {
            await generateMonthlyReports();
        } catch (error) {
            console.error('❌ [CRON] Monthly reports failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'monthly-reports',
    });
    console.log('✅ Monthly Reports: Scheduled for 09:00 AM on 1st of every month');

    // ========================================
    // 5. FUNDING REMINDER (Optional)
    // ========================================
    // Runs every Monday at 9 AM
    // Reminds users to fund their wallet for the week
    cron.schedule('0 9 * * 1', async () => {
        try {
            const { sendWeeklyFundingReminders } = await import('../utils/funding-reminders');
            await sendWeeklyFundingReminders();
        } catch (error) {
            console.error('❌ [CRON] Weekly funding reminders failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'weekly-funding-reminders',
    });
    console.log('✅ Weekly Funding Reminders: Scheduled for 09:00 AM every Monday');

    // ========================================
    // 6. STREAK RECOVERY NOTIFICATIONS
    // ========================================
    // Runs at 8 PM every day
    // Sends reminders to users who haven't saved yet today
    cron.schedule('0 20 * * *', async () => {
        try {
            const { sendStreakRecoveryReminders } = await import('../utils/streak-reminders');
            await sendStreakRecoveryReminders();
        } catch (error) {
            console.error('❌ [CRON] Streak recovery reminders failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'streak-recovery-reminders',
    });
    console.log('✅ Streak Recovery Reminders: Scheduled for 20:00 (8 PM) daily');

    // ========================================
    // 7. REFERRAL BONUS PROCESSING
    // ========================================
    // Runs at 3 AM every day
    // Checks and credits referral bonuses for users who completed their first week
    cron.schedule('0 3 * * *', async () => {
        try {
            const { processReferralBonuses } = await import('../utils/referral-bonus-processor');
            await processReferralBonuses();
        } catch (error) {
            console.error('❌ [CRON] Referral bonus processing failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'referral-bonus-processing',
    });
    console.log('✅ Referral Bonus Processing: Scheduled for 03:00 AM daily');

    // ========================================
    // 8. SESSION CLEANUP
    // ========================================
    // Runs at 4 AM every day
    // Cleans up expired sessions, tokens, and stale data
    cron.schedule('0 4 * * *', async () => {
        try {
            const { cleanupExpiredData } = await import('../utils/cleanup-service');
            await cleanupExpiredData();
        } catch (error) {
            console.error('❌ [CRON] Session cleanup failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'session-cleanup',
    });
    console.log('✅ Session Cleanup: Scheduled for 04:00 AM daily');

    // ========================================
    // 9. PENDING TRANSACTION SYNC
    // ========================================
    // Runs every 15 minutes
    // Syncs pending Stripe transactions and updates statuses
    cron.schedule('*/15 * * * *', async () => {
        try {
            const { syncPendingTransactions } = await import('../utils/transaction-sync');
            await syncPendingTransactions();
        } catch (error) {
            console.error('❌ [CRON] Transaction sync failed:', error);
        }
    }, {
        timezone: 'Asia/Karachi',
        name: 'transaction-sync',
    });
    console.log('✅ Transaction Sync: Scheduled every 15 minutes');

    console.log('\n✅ [CRON] All cron jobs initialized successfully\n');
}

/**
 * Gracefully stop all cron jobs
 */
export function stopAllCronJobs(): void {
    console.log('⏹️  [CRON] Stopping all cron jobs...');
    cron.getTasks().forEach((task, name) => {
        task.stop();
        console.log(`⏹️  Stopped: ${name || 'unnamed task'}`);
    });
    console.log('✅ [CRON] All cron jobs stopped');
}

/**
 * Get status of all cron jobs
 */
export function getCronJobsStatus(): Array<{ name: string; running: boolean }> {
    const tasks = cron.getTasks();
    const status: Array<{ name: string; running: boolean }> = [];

    tasks.forEach((task, name) => {
        status.push({
            name: name || 'unnamed',
            running: task.getStatus() === 'scheduled',
        });
    });

    return status;
}
