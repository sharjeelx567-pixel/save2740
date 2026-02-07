/**
 * Monthly Reports Generator
 * Generates and sends monthly savings summary reports to all users
 * 
 * Runs on the 1st of every month at 9 AM
 */

import { Wallet } from '../models/wallet.model';
import User from '../models/User';
import { Transaction } from '../models/transaction.model';
import { addNotificationJob, addEmailJob } from './job-queue';

interface MonthlyReportResult {
    totalProcessed: number;
    reportsSent: number;
    errors: number;
    details: Array<{
        userId: string;
        email: string;
        status: 'sent' | 'error' | 'skipped';
        message: string;
    }>;
}

interface MonthlyStats {
    totalSaved: number;
    savingsTransactions: number;
    totalWithdrawn: number;
    withdrawalTransactions: number;
    averageDailySaving: number;
    streakDays: number;
    currentBalance: number;
    lockedSavings: number;
}

/**
 * Generate and send monthly reports for all users
 */
export async function generateMonthlyReports(): Promise<MonthlyReportResult> {
    console.log('📊 [MONTHLY REPORTS] Starting monthly report generation...');
    const startTime = Date.now();

    const result: MonthlyReportResult = {
        totalProcessed: 0,
        reportsSent: 0,
        errors: 0,
        details: [],
    };

    try {
        // Calculate date range for last month
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthName = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Get all active users with email notifications enabled
        const users = await User.find({
            isActive: true,
            'preferences.emailNotifications': { $ne: false },
        }).select('_id email firstName');

        console.log(`📊 [MONTHLY REPORTS] Generating reports for ${users.length} users`);

        for (const user of users) {
            result.totalProcessed++;

            try {
                // Get wallet
                const wallet = await Wallet.findOne({ userId: user._id });
                if (!wallet) {
                    result.details.push({
                        userId: user._id.toString(),
                        email: user.email,
                        status: 'skipped',
                        message: 'No wallet found',
                    });
                    continue;
                }

                // Calculate monthly stats
                const stats = await calculateMonthlyStats(user._id.toString(), lastMonth, thisMonth, wallet);

                // Only send report if user had activity
                if (stats.totalSaved === 0 && stats.totalWithdrawn === 0) {
                    result.details.push({
                        userId: user._id.toString(),
                        email: user.email,
                        status: 'skipped',
                        message: 'No activity in month',
                    });
                    continue;
                }

                // Send push notification
                await addNotificationJob({
                    userId: user._id.toString(),
                    title: `📊 ${monthName} Savings Report`,
                    message: `You saved $${stats.totalSaved.toFixed(2)} last month! Your current savings: $${stats.lockedSavings.toFixed(2)}`,
                    type: 'info',
                    data: { type: 'monthly-report', month: monthName },
                });

                // Generate HTML report
                const htmlReport = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2E7D32;">Your ${monthName} Savings Report</h2>
                        <p>Hi ${user.firstName},</p>
                        <p>Here is your savings summary for ${monthName}:</p>
                        
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Total Saved:</strong> $${stats.totalSaved.toFixed(2)}</p>
                            <p style="margin: 5px 0;"><strong>Current Balance:</strong> $${stats.currentBalance.toFixed(2)}</p>
                            <p style="margin: 5px 0;"><strong>Locked Savings:</strong> $${stats.lockedSavings.toFixed(2)}</p>
                            <p style="margin: 5px 0;"><strong>Current Streak:</strong> ${stats.streakDays} days 🔥</p>
                        </div>
                        
                        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #2E7D32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
                    </div>
                `;

                // Send email with detailed report
                await addEmailJob({
                    to: user.email,
                    subject: `Your Save2740 ${monthName} Report`,
                    html: htmlReport,
                    text: `Your ${monthName} Savings Report\n\nTotal Saved: $${stats.totalSaved.toFixed(2)}\nLocked Savings: $${stats.lockedSavings.toFixed(2)}\n\nView details in your dashboard.`
                });

                result.reportsSent++;
                result.details.push({
                    userId: user._id.toString(),
                    email: user.email,
                    status: 'sent',
                    message: `Saved: $${stats.totalSaved.toFixed(2)}`,
                });

            } catch (error: any) {
                result.errors++;
                result.details.push({
                    userId: user._id.toString(),
                    email: user.email,
                    status: 'error',
                    message: error.message || 'Unknown error',
                });
                console.error(`❌ [MONTHLY REPORTS] Error for ${user.email}:`, error);
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ [MONTHLY REPORTS] Completed in ${duration}ms`);
        console.log(`📊 [MONTHLY REPORTS] Sent: ${result.reportsSent}, Errors: ${result.errors}, Skipped: ${result.totalProcessed - result.reportsSent - result.errors}`);

        return result;
    } catch (error) {
        console.error('❌ [MONTHLY REPORTS] Fatal error:', error);
        throw error;
    }
}

/**
 * Calculate monthly stats for a user
 */
async function calculateMonthlyStats(
    userId: string,
    startDate: Date,
    endDate: Date,
    wallet: any
): Promise<MonthlyStats> {
    // Get all transactions for the month
    const transactions = await Transaction.find({
        userId,
        createdAt: { $gte: startDate, $lt: endDate },
    });

    // Calculate savings
    const savingsTransactions = transactions.filter(t =>
        t.type === 'daily_savings' || t.type === 'manual_save'
    );
    const totalSaved = savingsTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate withdrawals
    const withdrawalTransactions = transactions.filter(t => t.type === 'withdrawal');
    const totalWithdrawn = withdrawalTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate days in month
    const daysInMonth = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
        totalSaved,
        savingsTransactions: savingsTransactions.length,
        totalWithdrawn,
        withdrawalTransactions: withdrawalTransactions.length,
        averageDailySaving: savingsTransactions.length > 0 ? totalSaved / savingsTransactions.length : 0,
        streakDays: wallet.currentStreak || 0,
        currentBalance: wallet.availableBalance || 0,
        lockedSavings: wallet.locked || 0,
    };
}
