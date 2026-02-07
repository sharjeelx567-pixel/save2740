/**
 * Referral Bonus Processor
 * Credits referral bonuses when referred users complete their first week of savings.
 * 
 * Runs daily at 3 AM
 * 
 * Bonus Structure:
 * - Referrer gets $5 bonus when their referral completes 7 days
 * - Referred user gets $2 bonus after first week
 */

import mongoose from 'mongoose';
import User from '../models/User';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';
import { addNotificationJob, addEmailJob } from './job-queue';

// Try to import Referral model, fall back to direct model access
let Referral: any;
try {
    Referral = require('../models/referral.model').Referral;
} catch {
    Referral = mongoose.model('Referral');
}

interface ReferralBonusResult {
    totalChecked: number;
    bonusesPaid: number;
    alreadyPaid: number;
    notEligible: number;
    errors: number;
    details: Array<{
        referralId: string;
        referrerId: string;
        referredId: string;
        status: 'paid' | 'already_paid' | 'not_eligible' | 'error';
        message: string;
    }>;
}

const REFERRER_BONUS = 5.00;  // $5 for the referrer
const REFERRED_BONUS = 2.00;  // $2 for the referred user
const REQUIRED_SAVINGS_DAYS = 7;

/**
 * Process referral bonuses for eligible referrals
 */
export async function processReferralBonuses(): Promise<ReferralBonusResult> {
    console.log('🎁 [REFERRAL BONUS] Starting referral bonus processing...');
    const startTime = Date.now();

    const result: ReferralBonusResult = {
        totalChecked: 0,
        bonusesPaid: 0,
        alreadyPaid: 0,
        notEligible: 0,
        errors: 0,
        details: [],
    };

    try {
        // Get all referrals that haven't been rewarded yet
        const pendingReferrals = await Referral.find({
            status: { $in: ['pending', 'signed_up'] },
            rewardPaid: { $ne: true },
        });

        result.totalChecked = pendingReferrals.length;
        console.log(`📊 [REFERRAL BONUS] Found ${result.totalChecked} pending referrals to check`);

        for (const referral of pendingReferrals) {
            try {
                const processResult = await processReferralBonus(referral);
                result.details.push(processResult);

                switch (processResult.status) {
                    case 'paid':
                        result.bonusesPaid++;
                        break;
                    case 'already_paid':
                        result.alreadyPaid++;
                        break;
                    case 'not_eligible':
                        result.notEligible++;
                        break;
                    case 'error':
                        result.errors++;
                        break;
                }
            } catch (error: any) {
                result.errors++;
                result.details.push({
                    referralId: referral._id.toString(),
                    referrerId: referral.referrerId?.toString() || 'unknown',
                    referredId: referral.referredUserId?.toString() || 'unknown',
                    status: 'error',
                    message: error.message || 'Unknown error',
                });
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ [REFERRAL BONUS] Completed in ${duration}ms`);
        console.log(`📊 [REFERRAL BONUS] Paid: ${result.bonusesPaid}, Not Eligible: ${result.notEligible}, Errors: ${result.errors}`);

        return result;
    } catch (error) {
        console.error('❌ [REFERRAL BONUS] Fatal error:', error);
        throw error;
    }
}

/**
 * Process bonus for a single referral
 */
async function processReferralBonus(referral: any): Promise<{
    referralId: string;
    referrerId: string;
    referredId: string;
    status: 'paid' | 'already_paid' | 'not_eligible' | 'error';
    message: string;
}> {
    const referralId = referral._id.toString();
    const referrerId = referral.referrerId?.toString();
    const referredId = referral.referredUserId?.toString();

    // Check if already paid
    if (referral.rewardPaid) {
        return {
            referralId,
            referrerId,
            referredId,
            status: 'already_paid',
            message: 'Bonus already paid',
        };
    }

    // Check if referred user exists
    if (!referredId) {
        return {
            referralId,
            referrerId,
            referredId: 'none',
            status: 'not_eligible',
            message: 'No referred user linked yet',
        };
    }

    // Get referred user's wallet and check savings history
    const referredWallet = await Wallet.findOne({ userId: referredId });
    if (!referredWallet) {
        return {
            referralId,
            referrerId,
            referredId,
            status: 'not_eligible',
            message: 'Referred user has no wallet',
        };
    }

    // Check if referred user has completed 7 days of savings
    const savingsCount = await Transaction.countDocuments({
        userId: referredId,
        type: { $in: ['daily_savings', 'manual_save'] },
        status: 'completed',
    });

    if (savingsCount < REQUIRED_SAVINGS_DAYS) {
        return {
            referralId,
            referrerId,
            referredId,
            status: 'not_eligible',
            message: `Referred user has ${savingsCount}/${REQUIRED_SAVINGS_DAYS} savings days`,
        };
    }

    // Start transaction for atomic bonus credit
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Credit referrer bonus
        const referrerWallet = await Wallet.findOne({ userId: referrerId }).session(session);
        if (referrerWallet) {
            referrerWallet.availableBalance += REFERRER_BONUS;
            await referrerWallet.save({ session });

            // Create transaction record for referrer
            await Transaction.create([{
                userId: referrerId,
                type: 'referral_bonus',
                amount: REFERRER_BONUS,
                status: 'completed',
                description: 'Referral bonus - your friend completed their first week!',
                metadata: { referralId, referredUserId: referredId },
            }], { session });

            // Notify referrer
            const referrer = await User.findById(referrerId);
            if (referrer) {
                await addNotificationJob({
                    userId: referrerId,
                    title: '🎉 Referral Bonus Earned!',
                    message: `You earned $${REFERRER_BONUS.toFixed(2)} because your friend completed their first week of savings!`,
                    type: 'reward',
                });

                // Send email to referrer
                await addEmailJob({
                    to: referrer.email,
                    subject: '🎉 You Earned a Referral Bonus!',
                    html: generateReferrerBonusEmail(referrer.firstName, REFERRER_BONUS),
                });
            }
        }

        // Credit referred user bonus
        referredWallet.availableBalance += REFERRED_BONUS;
        await referredWallet.save({ session });

        // Create transaction record for referred user
        await Transaction.create([{
            userId: referredId,
            type: 'referral_bonus',
            amount: REFERRED_BONUS,
            status: 'completed',
            description: 'Welcome bonus - thank you for completing your first week!',
            metadata: { referralId },
        }], { session });

        // Notify referred user
        const referredUser = await User.findById(referredId);
        if (referredUser) {
            await addNotificationJob({
                userId: referredId,
                title: '🎉 Welcome Bonus!',
                message: `You earned $${REFERRED_BONUS.toFixed(2)} for completing your first week of savings!`,
                type: 'reward',
            });

            // Send email to referred user
            await addEmailJob({
                to: referredUser.email,
                subject: '🎉 Welcome Bonus Credited!',
                html: generateReferredBonusEmail(referredUser.firstName, REFERRED_BONUS),
            });
        }

        // Mark referral as rewarded
        referral.status = 'completed';
        referral.rewardPaid = true;
        referral.rewardPaidAt = new Date();
        referral.referrerBonusAmount = REFERRER_BONUS;
        referral.referredBonusAmount = REFERRED_BONUS;
        await referral.save({ session });

        await session.commitTransaction();

        console.log(`💰 [REFERRAL BONUS] Paid bonuses for referral ${referralId}`);

        return {
            referralId,
            referrerId,
            referredId,
            status: 'paid',
            message: `Referrer: $${REFERRER_BONUS}, Referred: $${REFERRED_BONUS}`,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Generate HTML email for referrer bonus
 */
function generateReferrerBonusEmail(firstName: string, amount: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .bonus-box { background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .amount { font-size: 48px; font-weight: bold; color: #10b981; }
    .celebrate { font-size: 24px; margin: 10px 0; }
    .share-cta { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Referral Bonus Earned!</h1>
      <p>Your friend completed their first week of savings!</p>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>

      <div class="bonus-box">
        <div class="celebrate">🎊</div>
        <p>Your Referral Bonus</p>
        <div class="amount">$${amount.toFixed(2)}</div>
        <p>has been added to your wallet!</p>
      </div>

      <p>Thanks for spreading the word about Save2740! Your referral has completed their first week of savings, and this bonus has been credited to your wallet.</p>

      <div class="share-cta">
        <strong>💡 Keep sharing!</strong> Each friend who joins and completes their first week earns you another $${amount.toFixed(2)} bonus.
      </div>

      <p>Keep helping others start their savings journey! 🚀</p>
    </div>
    <div class="footer">
      <p>Save2740 - Building your savings, one day at a time</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate HTML email for referred user bonus
 */
function generateReferredBonusEmail(firstName: string, amount: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .bonus-box { background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .amount { font-size: 48px; font-weight: bold; color: #10b981; }
    .milestone { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome Bonus!</h1>
      <p>Congratulations on your first week!</p>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>

      <div class="bonus-box">
        <p>Your Welcome Bonus</p>
        <div class="amount">$${amount.toFixed(2)}</div>
        <p>has been added to your wallet!</p>
      </div>

      <div class="milestone">
        <strong>🏆 First Week Complete!</strong> You've shown commitment to building your savings habit. This bonus is our way of saying thanks for getting started!
      </div>

      <p>You're off to a great start! Keep saving daily to build your streak and watch your savings grow.</p>

      <p>The more you save, the more you'll see your financial future brighten! 💫</p>
    </div>
    <div class="footer">
      <p>Save2740 - Building your savings, one day at a time</p>
    </div>
  </div>
</body>
</html>`;
}
