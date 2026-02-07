/**
 * Streak Recovery Reminders
 * Sends evening reminders to users who haven't saved today
 * to help them maintain their streak.
 * 
 * Runs at 8 PM every day
 */

import { Wallet } from '../models/wallet.model';
import User from '../models/User';
import { addNotificationJob, addEmailJob } from './job-queue';

interface StreakReminderResult {
    totalChecked: number;
    remindersSent: number;
    skipped: number;
    details: Array<{
        userId: string;
        email: string;
        currentStreak: number;
        status: 'sent' | 'skipped' | 'already_saved';
    }>;
}

/**
 * Send streak recovery reminders to users who haven't saved today
 */
export async function sendStreakRecoveryReminders(): Promise<StreakReminderResult> {
    console.log('🔥 [STREAK REMINDERS] Checking for users who need streak reminders...');

    const result: StreakReminderResult = {
        totalChecked: 0,
        remindersSent: 0,
        skipped: 0,
        details: [],
    };

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all active wallets with a streak > 0
        const wallets = await Wallet.find({
            status: 'active',
            currentStreak: { $gt: 0 },
        });

        result.totalChecked = wallets.length;
        console.log(`📊 [STREAK REMINDERS] Checking ${result.totalChecked} wallets with active streaks`);

        for (const wallet of wallets) {
            // Check if already saved today
            const lastSavingDate = wallet.lastDailySavingDate ? new Date(wallet.lastDailySavingDate) : null;
            
            if (lastSavingDate) {
                lastSavingDate.setHours(0, 0, 0, 0);
                if (lastSavingDate.getTime() === today.getTime()) {
                    result.skipped++;
                    result.details.push({
                        userId: wallet.userId,
                        email: '',
                        currentStreak: wallet.currentStreak,
                        status: 'already_saved',
                    });
                    continue;
                }
            }

            const user = await User.findOne({ _id: wallet.userId });
            if (!user) continue;

            // Skip if user has opted out of streak reminders
            if (user.preferences?.streakReminders === false) {
                result.skipped++;
                result.details.push({
                    userId: wallet.userId,
                    email: user.email,
                    currentStreak: wallet.currentStreak,
                    status: 'skipped',
                });
                continue;
            }

            // Check if user has sufficient balance
            const dailyAmount = wallet.dailySavingAmount || 7.51;
            if (wallet.availableBalance < dailyAmount) {
                // Send different message if insufficient funds
                await addNotificationJob({
                    userId: wallet.userId,
                    title: '⚠️ Streak at Risk!',
                    message: `Your ${wallet.currentStreak}-day streak may break! Add funds to continue saving.`,
                    type: 'alert',
                });

                // Send email alert
                if (user.preferences?.emailNotifications !== false) {
                    await addEmailJob({
                        to: user.email,
                        subject: '⚠️ Your Save2740 Streak is at Risk!',
                        html: generateStreakAtRiskEmail(user.firstName, wallet.currentStreak, wallet.availableBalance),
                    });
                }
            } else {
                // Regular streak reminder
                await addNotificationJob({
                    userId: wallet.userId,
                    title: '🔥 Keep Your Streak Alive!',
                    message: `Don't lose your ${wallet.currentStreak}-day streak! Savings run at midnight.`,
                    type: 'reminder',
                });

                // Send email reminder
                if (user.preferences?.emailNotifications !== false) {
                    await addEmailJob({
                        to: user.email,
                        subject: '🔥 Keep Your Save2740 Streak Alive!',
                        html: generateStreakReminderEmail(user.firstName, wallet.currentStreak),
                    });
                }
            }

            result.remindersSent++;
            result.details.push({
                userId: wallet.userId,
                email: user.email,
                currentStreak: wallet.currentStreak,
                status: 'sent',
            });

            console.log(`📧 [STREAK REMINDERS] Sent reminder to ${user.email}: ${wallet.currentStreak}-day streak`);
        }

        console.log(`✅ [STREAK REMINDERS] Sent ${result.remindersSent} reminders, skipped ${result.skipped}`);
        return result;

    } catch (error) {
        console.error('❌ [STREAK REMINDERS] Error sending reminders:', error);
        throw error;
    }
}

/**
 * Generate HTML email for streak at risk
 */
function generateStreakAtRiskEmail(firstName: string, currentStreak: number, balance: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    .streak-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .streak-number { font-size: 48px; font-weight: bold; }
    .action-button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Your Streak is at Risk!</h1>
      <p>Urgent: Add funds to continue saving</p>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>

      <div class="alert-box">
        <strong>🚨 Low Balance Alert:</strong> Your wallet balance ($${balance.toFixed(2)}) is too low for tonight's automatic savings!
      </div>

      <div class="streak-badge">
        <div class="streak-number">${currentStreak}</div>
        <div>Day Streak</div>
      </div>

      <p>Don't let your <strong>${currentStreak}-day streak</strong> end tonight! Add funds to your wallet before midnight to keep your momentum going.</p>

      <center>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/add-money" class="action-button">
          Add Funds Now
        </a>
      </center>

      <p>Every day counts towards your financial goals! 💪</p>
    </div>
    <div class="footer">
      <p>Save2740 - Building your savings, one day at a time</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate HTML email for streak reminder
 */
function generateStreakReminderEmail(firstName: string, currentStreak: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .streak-badge { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .streak-number { font-size: 48px; font-weight: bold; }
    .info-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 Keep Your Streak Alive!</h1>
      <p>Evening savings reminder</p>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>

      <div class="streak-badge">
        <div class="streak-number">${currentStreak}</div>
        <div>Day Streak 🔥</div>
      </div>

      <div class="info-box">
        <strong>⏰ Reminder:</strong> Your automatic savings runs at midnight. Your wallet is funded and ready!
      </div>

      <p>You're doing amazing! Keep up the great work and watch your savings grow every day.</p>

      <p>Tomorrow you'll be at <strong>${currentStreak + 1} days</strong>! 🎯</p>
    </div>
    <div class="footer">
      <p>Save2740 - Building your savings, one day at a time</p>
    </div>
  </div>
</body>
</html>`;
}
