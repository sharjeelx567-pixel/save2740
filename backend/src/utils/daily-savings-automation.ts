/**
 * Daily Savings Automation Script
 * Runs at midnight (00:00) every day to process internal ledger allocations
 * for all active Save2740 users.
 * 
 * This is the CORE of the ledger-first design:
 * - No external payment rails (no fees, no declines)
 * - Internal wallet → Internal saver pockets
 * - Automated, scalable, reliable
 */

import { Wallet, IWallet } from '../models/wallet.model';
import User from '../models/User';
import { Transaction } from '../models/transaction.model';
import { addNotificationJob, addEmailJob } from './job-queue';
import { DAILY_SAVINGS_AMOUNT } from '../config/payment-architecture';
import mongoose from 'mongoose';

interface DailySavingsResult {
    totalProcessed: number;
    successful: number;
    insufficientFunds: number;
    errors: number;
    skipped: number;
    details: Array<{
        userId: string;
        email: string;
        status: 'success' | 'insufficient_funds' | 'error' | 'skipped';
        message: string;
        amount?: number;
    }>;
}

/**
 * Main function to process daily savings for all users
 */
export async function processDailySavingsForAllUsers(): Promise<DailySavingsResult> {
    console.log('🚀 [DAILY SAVINGS] Starting daily savings automation...');
    const startTime = Date.now();

    const result: DailySavingsResult = {
        totalProcessed: 0,
        successful: 0,
        insufficientFunds: 0,
        errors: 0,
        skipped: 0,
        details: [],
    };

    try {
        // Get all active users who have opted into daily savings
        const users = await User.find({
            isActive: true,
            'preferences.dailySavingsEnabled': { $ne: false }, // Default to true if not set
        }).select('_id email firstName');

        console.log(`📊 [DAILY SAVINGS] Found ${users.length} eligible users`);

        // Process each user
        for (const user of users) {
            result.totalProcessed++;

            try {
                const processResult = await processDailySavingsForUser(user._id.toString(), user.email, user.firstName);
                result.details.push(processResult);

                if (processResult.status === 'success') {
                    result.successful++;
                } else if (processResult.status === 'insufficient_funds') {
                    result.insufficientFunds++;
                } else if (processResult.status === 'skipped') {
                    result.skipped++;
                } else {
                    result.errors++;
                }
            } catch (error: any) {
                result.errors++;
                result.details.push({
                    userId: user._id.toString(),
                    email: user.email,
                    status: 'error',
                    message: error.message || 'Unknown error',
                });
                console.error(`❌ [DAILY SAVINGS] Error processing user ${user.email}:`, error);
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ [DAILY SAVINGS] Completed in ${duration}ms`);
        console.log(`📊 [DAILY SAVINGS] Results: ${result.successful} successful, ${result.insufficientFunds} insufficient funds, ${result.errors} errors, ${result.skipped} skipped`);

        // Log summary to database for audit
        await logDailySavingsSummary(result);

        return result;
    } catch (error) {
        console.error('❌ [DAILY SAVINGS] Fatal error in daily savings automation:', error);
        throw error;
    }
}

/**
 * Process daily savings for a single user
 */
async function processDailySavingsForUser(
    userId: string,
    email: string,
    firstName: string
): Promise<{
    userId: string;
    email: string;
    status: 'success' | 'insufficient_funds' | 'error' | 'skipped';
    message: string;
    amount?: number;
}> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get user's wallet
        const wallet = await Wallet.findOne({ userId }).session(session);

        if (!wallet) {
            await session.abortTransaction();
            return {
                userId,
                email,
                status: 'error',
                message: 'Wallet not found',
            };
        }

        // Check if wallet is active
        if (wallet.status !== 'active') {
            await session.abortTransaction();
            return {
                userId,
                email,
                status: 'skipped',
                message: `Wallet status: ${wallet.status}`,
            };
        }

        // Check if already saved today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (wallet.lastDailySavingDate) {
            const lastSavingDate = new Date(wallet.lastDailySavingDate);
            lastSavingDate.setHours(0, 0, 0, 0);

            if (lastSavingDate.getTime() === today.getTime()) {
                await session.abortTransaction();
                return {
                    userId,
                    email,
                    status: 'skipped',
                    message: 'Already saved today',
                };
            }
        }

        // Get daily savings amount (user-specific or default)
        const dailyAmount = wallet.dailySavingAmount || DAILY_SAVINGS_AMOUNT;

        // Check if sufficient balance
        if (wallet.availableBalance < dailyAmount) {
            await session.abortTransaction();

            // Send low balance notification
            await addNotificationJob({
                userId,
                title: '⚠️ Low Balance Alert',
                message: `Your wallet balance is too low ($${wallet.availableBalance.toFixed(2)}) to complete today's $${dailyAmount.toFixed(2)} savings. Please add funds to continue your streak!`,
                type: 'alert',
            });

            return {
                userId,
                email,
                status: 'insufficient_funds',
                message: `Insufficient balance: $${wallet.availableBalance.toFixed(2)} < $${dailyAmount.toFixed(2)}`,
            };
        }

        // **CRITICAL: LEDGER-FIRST ALLOCATION** (NO EXTERNAL PAYMENT RAILS)
        // Move funds from available balance to locked balance (internal transfer)
        wallet.availableBalance -= dailyAmount;
        wallet.locked += dailyAmount;
        wallet.lastDailySavingDate = today;

        // Update streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastSavingDate = wallet.lastDailySavingDate ? new Date(wallet.lastDailySavingDate) : null;

        if (lastSavingDate) {
            lastSavingDate.setHours(0, 0, 0, 0);
            if (lastSavingDate.getTime() === yesterday.getTime()) {
                wallet.currentStreak += 1;
            } else {
                wallet.currentStreak = 1; // Streak broken, restart
            }
        } else {
            wallet.currentStreak = 1;
        }

        await wallet.save({ session });

        // Create transaction record (for ledger audit trail)
        await Transaction.create([{
            userId,
            type: 'transfer',
            amount: dailyAmount,
            status: 'completed',
            description: `Daily Savings Allocation - Day ${wallet.currentStreak}`,
            category: 'savings',
            fee: 0, // No fee for internal transfers
            balanceBefore: wallet.availableBalance + dailyAmount,
            balanceAfter: wallet.availableBalance,
            metadata: {
                dailySavingsAutomation: true,
                streak: wallet.currentStreak,
                allocationType: 'ledger_internal',
            },
        }], { session });

        await session.commitTransaction();

        // Send success notification (if user wants daily confirmations)
        await addNotificationJob({
            userId,
            title: '🎉 Daily Savings Complete!',
            message: `$${dailyAmount.toFixed(2)} saved today! Your streak: ${wallet.currentStreak} days 🔥`,
            type: 'success',
        });

        // Send daily email summary
        await addEmailJob({
            to: email,
            subject: '🎉 Your Daily Savings is Complete!',
            html: generateDailySavingsEmail(firstName, dailyAmount, wallet.currentStreak, wallet.locked),
        });

        console.log(`✅ [DAILY SAVINGS] User ${email}: Saved $${dailyAmount} (Streak: ${wallet.currentStreak} days)`);

        return {
            userId,
            email,
            status: 'success',
            message: `Saved $${dailyAmount.toFixed(2)}, Streak: ${wallet.currentStreak} days`,
            amount: dailyAmount,
        };

    } catch (error: any) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Log daily savings summary for audit/analytics
 */
async function logDailySavingsSummary(result: DailySavingsResult): Promise<void> {
    try {
        // Store in admin logs collection for auditing
        const AdminLog = mongoose.model('AdminLog');
        await AdminLog.create({
            type: 'daily_savings_automation',
            timestamp: new Date(),
            summary: {
                totalProcessed: result.totalProcessed,
                successful: result.successful,
                insufficientFunds: result.insufficientFunds,
                errors: result.errors,
                skipped: result.skipped,
            },
            details: result.details.map(d => ({
                userId: d.userId,
                status: d.status,
                amount: d.amount,
            })),
        });
    } catch (error) {
        console.error('Failed to log daily savings summary:', error);
        // Don't throw - logging failure shouldn't stop the process
    }
}

/**
 * Scheduled job wrapper (called by cron)
 */
export async function runDailySavingsScheduledJob(): Promise<void> {
    console.log('\n========================================');
    console.log('⏰ [CRON] Daily Savings Automation Triggered');
    console.log(`🕐 Time: ${new Date().toISOString()}`);
    console.log('========================================\n');

    try {
        const result = await processDailySavingsForAllUsers();

        console.log('\n========================================');
        console.log('✅ [CRON] Daily Savings Automation Complete');
        console.log(`📊 Processed: ${result.totalProcessed}`);
        console.log(`✅ Successful: ${result.successful}`);
        console.log(`⚠️  Insufficient Funds: ${result.insufficientFunds}`);
        console.log(`❌ Errors: ${result.errors}`);
        console.log(`⏭️  Skipped: ${result.skipped}`);
        console.log('========================================\n');
    } catch (error) {
        console.error('\n========================================');
        console.error('❌ [CRON] Daily Savings Automation Failed');
        console.error(error);
        console.error('========================================\n');

        // Send alert to admin
        // TODO: Implement admin alert system
    }
}

/**
 * Generate HTML email for daily savings confirmation
 */
function generateDailySavingsEmail(firstName: string, amount: number, streak: number, totalSavings: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .savings-box { background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .amount { font-size: 36px; font-weight: bold; color: #10b981; }
    .streak-badge { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 10px 20px; border-radius: 20px; margin: 15px 0; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
    .stat-label { color: #6b7280; font-size: 12px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Daily Savings Complete!</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>
      
      <div class="savings-box">
        <p>Today's Savings</p>
        <div class="amount">$${amount.toFixed(2)}</div>
        <div class="streak-badge">🔥 ${streak} Day Streak!</div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${streak}</div>
          <div class="stat-label">Day Streak</div>
        </div>
        <div class="stat">
          <div class="stat-value">$${totalSavings.toFixed(2)}</div>
          <div class="stat-label">Total Saved</div>
        </div>
      </div>

      <p>You're building great savings habits! Keep it up and watch your savings grow day by day. 💪</p>
      
      <p>See you tomorrow for Day ${streak + 1}! 🎯</p>
    </div>
    <div class="footer">
      <p>Save2740 - Building your savings, one day at a time</p>
      <p><small>You're receiving this because you have daily savings enabled. Manage notifications in your account settings.</small></p>
    </div>
  </div>
</body>
</html>`;
}
