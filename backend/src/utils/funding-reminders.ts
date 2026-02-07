/**
 * Funding Reminders System
 * Sends weekly reminders to users to fund their wallet
 * 
 * Runs every Monday at 9 AM
 */

import { Wallet } from '../models/wallet.model';
import User from '../models/User';
import { addNotificationJob, addEmailJob } from './job-queue';
import { DAILY_SAVINGS_AMOUNT, FUNDING_CADENCE } from '../config/payment-architecture';

interface FundingReminderResult {
    totalChecked: number;
    remindersSent: number;
    skipped: number;
    details: Array<{
        userId: string;
        email: string;
        balance: number;
        daysRemaining: number;
        status: 'sent' | 'skipped';
    }>;
}

/**
 * Send weekly funding reminders to users with low balances
 */
export async function sendWeeklyFundingReminders(): Promise<FundingReminderResult> {
    console.log('💰 [FUNDING REMINDERS] Checking wallet balances for weekly reminders...');

    const result: FundingReminderResult = {
        totalChecked: 0,
        remindersSent: 0,
        skipped: 0,
        details: [],
    };

    try {
        // Get all active wallets
        const wallets = await Wallet.find({
            status: 'active',
        });

        result.totalChecked = wallets.length;
        console.log(`📊 [FUNDING REMINDERS] Checking ${result.totalChecked} wallets`);

        // Determine recommended weekly funding amount
        const recommendedWeeklyFund = DAILY_SAVINGS_AMOUNT * FUNDING_CADENCE.RECOMMENDED_BUFFER_DAYS;

        for (const wallet of wallets) {
            const dailyAmount = wallet.dailySavingAmount || DAILY_SAVINGS_AMOUNT;
            const daysRemaining = Math.floor(wallet.availableBalance / dailyAmount);

            // Send reminder if user has less than 10 days of savings
            if (daysRemaining < 10) {
                const user = await User.findOne({ _id: wallet.userId });
                if (!user) continue;

                // Skip if user has opted out of reminders
                if (user.preferences?.fundingReminders === false) {
                    result.skipped++;
                    result.details.push({
                        userId: wallet.userId,
                        email: user.email,
                        balance: wallet.availableBalance,
                        daysRemaining,
                        status: 'skipped',
                    });
                    continue;
                }

                const suggestedAmount = Math.ceil((7 - daysRemaining) * dailyAmount / 10) * 10; // Round to nearest $10

                // Send push notification
                await addNotificationJob({
                    userId: wallet.userId,
                    title: '💰 Time to Fund Your Wallet',
                    message: `You have ${daysRemaining} days of savings left. Add $${suggestedAmount} to stay on track!`,
                    type: 'reminder',
                    data: {
                        type: 'funding-reminder',
                        suggestedAmount,
                        daysRemaining,
                    },
                });

                // Send email if enabled
                if (user.preferences?.emailNotifications !== false) {
                    await addEmailJob({
                        to: user.email,
                        subject: '💰 Time to Fund Your Save2740 Wallet',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #2E7D32;">Time to Fund Your Wallet</h2>
                                <p>Hi ${user.firstName},</p>
                                <p>This is a friendly reminder that your wallet balance is getting low.</p>
                                
                                <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Current Balance:</strong> $${wallet.availableBalance.toFixed(2)}</p>
                                    <p style="margin: 5px 0;"><strong>Daily/Weekly Usage:</strong> $${dailyAmount.toFixed(2)}</p>
                                    <p style="margin: 5px 0;"><strong>Days Remaining:</strong> ${daysRemaining}</p>
                                </div>
                                
                                <p>To avoid missing your savings goals, we suggest adding funds soon.</p>
                                <p><strong>Suggested Amount:</strong> $${suggestedAmount}</p>

                                <a href="${process.env.FRONTEND_URL}/my-wallet" style="display: inline-block; background-color: #2E7D32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Add Funds Now</a>
                            </div>
                        `,
                        text: `Time to Fund Your Wallet\n\nHi ${user.firstName},\n\nYour wallet balance is low ($${wallet.availableBalance.toFixed(2)}). You have approximately ${daysRemaining} days remaining.\n\nSuggested Top-up: $${suggestedAmount}\n\nAdd funds: ${process.env.FRONTEND_URL}/my-wallet`
                    });
                }

                result.remindersSent++;
                result.details.push({
                    userId: wallet.userId,
                    email: user.email,
                    balance: wallet.availableBalance,
                    daysRemaining,
                    status: 'sent',
                });

                console.log(`📧 [FUNDING REMINDERS] Sent reminder to ${user.email}: ${daysRemaining} days remaining`);
            } else {
                result.skipped++;
            }
        }

        console.log(`✅ [FUNDING REMINDERS] Sent ${result.remindersSent} reminders, skipped ${result.skipped}`);
        return result;

    } catch (error) {
        console.error('❌ [FUNDING REMINDERS] Error sending reminders:', error);
        throw error;
    }
}
