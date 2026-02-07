/**
 * Low Balance Alert System
 * Proactively notifies users when their wallet balance is insufficient
 * for upcoming daily savings to prevent streak breaks.
 * 
 * Runs daily at 10 AM
 */

import { Wallet } from '../models/wallet.model';
import User from '../models/User';
import { addNotificationJob, addEmailJob } from './job-queue';
import { notifyLowBalance } from './notification-service';
import { DAILY_SAVINGS_AMOUNT, FUNDING_CADENCE } from '../config/payment-architecture';

interface AlertResult {
    totalChecked: number;
    alertsSent: number;
    details: Array<{
        userId: string;
        email: string;
        balance: number;
        daysRemaining: number;
    }>;
}

/**
 * Send low balance alerts to users
 */
export async function sendLowBalanceAlerts(): Promise<AlertResult> {
    console.log('⚠️  [LOW BALANCE] Checking user balances...');

    const result: AlertResult = {
        totalChecked: 0,
        alertsSent: 0,
        details: [],
    };

    try {
        // Get all active wallets
        const wallets = await Wallet.find({
            status: 'active',
        }).limit(10000); // Process in batches for large user bases

        result.totalChecked = wallets.length;

        for (const wallet of wallets) {
            const dailyAmount = wallet.dailySavingAmount || DAILY_SAVINGS_AMOUNT;
            const daysRemaining = Math.floor(wallet.availableBalance / dailyAmount);

            // Alert thresholds:
            // - 3 days or less: Critical alert
            // - 7 days or less: Warning alert
            if (daysRemaining <= 7) {
                const user = await User.findOne({ _id: wallet.userId });
                if (!user) continue;

                const alertLevel = daysRemaining <= 3 ? 'critical' : 'warning';

                await sendLowBalanceAlert({
                    user,
                    wallet,
                    daysRemaining,
                    alertLevel,
                });

                result.alertsSent++;
                result.details.push({
                    userId: wallet.userId,
                    email: user.email,
                    balance: wallet.availableBalance,
                    daysRemaining,
                });

                console.log(`📧 [LOW BALANCE] Alert sent to ${user.email}: ${daysRemaining} days remaining`);
            }
        }

        console.log(`✅ [LOW BALANCE] Checked ${result.totalChecked} wallets, sent ${result.alertsSent} alerts`);
        return result;

    } catch (error) {
        console.error('❌ [LOW BALANCE] Error sending alerts:', error);
        throw error;
    }
}

/**
 * Send low balance alert to a specific user
 */
async function sendLowBalanceAlert(params: {
    user: any;
    wallet: any;
    daysRemaining: number;
    alertLevel: 'warning' | 'critical';
}): Promise<void> {
    const { user, wallet, daysRemaining, alertLevel } = params;
    const dailyAmount = wallet.dailySavingAmount || DAILY_SAVINGS_AMOUNT;

    // Calculate recommended top-up amount
    const recommendedTopUp = alertLevel === 'critical'
        ? FUNDING_CADENCE.WEEKLY_AMOUNT
        : FUNDING_CADENCE.MONTHLY_AMOUNT;

    // Send in-app notification (critical for <= 3 days)
    await notifyLowBalance(
        user._id.toString(),
        wallet.availableBalance,
        daysRemaining,
        alertLevel === 'critical'
    );

    // Send email (for critical alerts)
    if (alertLevel === 'critical') {
        await addEmailJob({
            to: user.email,
            subject: '🚨 Save2740: Your wallet needs funding!',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .action-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .stats { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️  Low Balance Alert</h1>
              <p>Your Save2740 wallet needs attention!</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>🚨 Critical:</strong> Your wallet balance is running low!
              </div>

              <p>Hi ${user.firstName},</p>

              <p>Your Save2740 wallet currently has <strong>$${wallet.availableBalance.toFixed(2)}</strong>, which will only cover <strong>${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''}</strong> of your daily $${dailyAmount.toFixed(2)} savings.</p>

              <div class="stats">
                <p><strong>📊 Your Stats:</strong></p>
                <ul>
                  <li>Current Balance: $${wallet.availableBalance.toFixed(2)}</li>
                  <li>Daily Savings: $${dailyAmount.toFixed(2)}</li>
                  <li>Days Remaining: ${daysRemaining}</li>
                  <li>Current Streak: ${wallet.currentStreak} days 🔥</li>
                </ul>
              </div>

              <p><strong>Don't break your ${wallet.currentStreak}-day streak!</strong> Add funds now to keep your savings momentum going.</p>

              <p>💡 <strong>Recommended:</strong> Add $${recommendedTopUp.toFixed(2)} to cover the next week.</p>

              <a href="${process.env.FRONTEND_URL}/my-wallet" class="action-button">
                💰 Add Money to Wallet
              </a>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                <em>This is an automated alert from Save2740 to help you maintain your savings streak. You can adjust your notification preferences in your account settings.</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
        Low Balance Alert - Save2740

        Hi ${user.firstName},

        Your Save2740 wallet currently has $${wallet.availableBalance.toFixed(2)}, which will only cover ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} of your daily $${dailyAmount.toFixed(2)} savings.

        Current Streak: ${wallet.currentStreak} days 🔥
        
        Don't break your streak! Add funds now to keep your savings momentum going.

        Recommended: Add $${recommendedTopUp.toFixed(2)} to cover the next week.

        Add Money: ${process.env.FRONTEND_URL}/my-wallet
      `,
        });
    }
}

/**
 * Check if a specific user needs a low balance alert
 */
export async function checkUserBalance(userId: string): Promise<{
    needsAlert: boolean;
    daysRemaining: number;
    recommendedTopUp: number;
}> {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
        return {
            needsAlert: false,
            daysRemaining: 0,
            recommendedTopUp: 0,
        };
    }

    const dailyAmount = wallet.dailySavingAmount || DAILY_SAVINGS_AMOUNT;
    const daysRemaining = Math.floor(wallet.availableBalance / dailyAmount);
    const needsAlert = daysRemaining <= 7;

    const recommendedTopUp = daysRemaining <= 3
        ? FUNDING_CADENCE.WEEKLY_AMOUNT
        : FUNDING_CADENCE.MONTHLY_AMOUNT;

    return {
        needsAlert,
        daysRemaining,
        recommendedTopUp,
    };
}
