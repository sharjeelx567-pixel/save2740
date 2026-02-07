/**
 * Notification Service
 * Central service for creating notifications from events
 * Ensures all critical events trigger appropriate notifications
 */

import Notification from '../models/Notification';
import { User } from '../models/auth.model';
import { addNotificationJob } from './job-queue';

/** Get all admin user IDs (Admin collection + User with role admin/super_admin) for sending admin notifications */
export async function getAdminUserIds(): Promise<string[]> {
    const { Admin } = await import('../modules/admin/auth/admin.model');
    const [adminDocs, userAdmins] = await Promise.all([
        Admin.find({ isActive: true }).select('_id').lean(),
        User.find({ role: { $in: ['admin', 'super_admin'] }, accountStatus: 'active' }).select('_id').lean()
    ]);
    const ids = new Set<string>();
    adminDocs.forEach((a: any) => ids.add(a._id.toString()));
    userAdmins.forEach((u: any) => ids.add(u._id.toString()));
    return Array.from(ids);
}

/** Notify all admins when a user submits KYC */
export async function notifyAdminsKycSubmitted(userId: string, userName: string, userEmail: string): Promise<void> {
    try {
        const adminIds = await getAdminUserIds();
        if (adminIds.length === 0) return;
        const notifications = adminIds.map(adminId => ({
            userId: adminId,
            type: 'kyc_status',
            title: 'New KYC submission',
            message: `${userName || userEmail} submitted KYC for review.`,
            read: false,
            relatedData: { submittedByUserId: userId, submittedByName: userName, submittedByEmail: userEmail },
            channels: { email: false, sms: false, push: false },
            sentAt: new Date()
        }));
        await Notification.insertMany(notifications);
        console.log(`✅ [NOTIFICATION] KYC submission notified to ${adminIds.length} admin(s)`);
    } catch (error) {
        console.error('❌ [NOTIFICATION] notifyAdminsKycSubmitted failed:', error);
    }
}

/** Notify all admins when a payment is received */
export async function notifyAdminsPaymentReceived(userId: string, userName: string, amount: number, transactionId: string): Promise<void> {
    try {
        const adminIds = await getAdminUserIds();
        if (adminIds.length === 0) return;
        const notifications = adminIds.map(adminId => ({
            userId: adminId,
            type: 'payment_success',
            title: 'New payment received',
            message: `${userName || 'A user'} added $${amount.toFixed(2)}.`,
            read: false,
            relatedData: { userId, userName, amount, transactionId },
            channels: { email: false, sms: false, push: false },
            sentAt: new Date()
        }));
        await Notification.insertMany(notifications);
        console.log(`✅ [NOTIFICATION] Payment received notified to ${adminIds.length} admin(s)`);
    } catch (error) {
        console.error('❌ [NOTIFICATION] notifyAdminsPaymentReceived failed:', error);
    }
}

interface CreateNotificationParams {
    userId: string;
    type: string;
    title: string;
    message: string;
    isCritical?: boolean;
    relatedData?: any;
}

/**
 * Create a notification (direct database insertion)
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
    try {
        await Notification.create({
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            isCritical: params.isCritical || false,
            relatedData: params.relatedData || {},
            read: false,
        });

        console.log(`\u2705 [NOTIFICATION] Created ${params.isCritical ? 'CRITICAL' : ''} notification for user ${params.userId}: ${params.type}`);
    } catch (error) {
        console.error('\u274c [NOTIFICATION] Failed to create notification:', error);
        throw error;
    }
}

/**
 * Transaction Success Notification
 */
export async function notifyTransactionSuccess(userId: string, transactionId: string, amount: number): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'payment_success',
        title: '\u2705 Payment Successful',
        message: `Your payment of $${amount.toFixed(2)} has been processed successfully.`,

    });
}

/**
 * Transaction Failed Notification (CRITICAL)
 */
export async function notifyTransactionFailed(userId: string, transactionId: string, amount: number, reason: string): Promise<void> {
    await createNotification({
        userId,
        type: 'transaction_failed',
        title: '\u274c Payment Failed',
        message: `Your payment of $${amount.toFixed(2)} failed: ${reason}. Please update your payment method.`,
        isCritical: true,
        relatedData: { transactionId, amount, reason },
    });
}

/**
 * Withdrawal Initiated Notification
 */
export async function notifyWithdrawalInitiated(userId: string, withdrawalId: string, amount: number): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'withdrawal_initiated',
        title: '\ud83d\udc4d Withdrawal Initiated',
        message: `Your withdrawal of $${amount.toFixed(2)} is being processed. Funds will arrive in 2-3 business days.`,

    });
}

/**
 * Withdrawal Completed Notification
 */
export async function notifyWithdrawalCompleted(userId: string, withdrawalId: string, amount: number): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'withdrawal_completed',
        title: '\u2705 Withdrawal Completed',
        message: `Your withdrawal of $${amount.toFixed(2)} has been sent to your account.`,
    });
}

/**
 * Referral Bonus Notification
 */
export async function notifyReferralBonus(userId: string, referralId: string, bonusAmount: number, referredUserEmail: string): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'referral_bonus',
        title: '\ud83c\udf89 Referral Bonus Earned!',
        message: `You earned $${bonusAmount.toFixed(2)} for referring ${referredUserEmail}!`,

    });
}

/**
 * Savings Milestone Notification
 */
export async function notifySavingsMilestone(userId: string, milestone: number, currentBalance: number): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'savings_milestone',
        title: `\ud83c\udfc6 Milestone Reached: $${milestone}!`,
        message: `Congratulations! You've saved $${currentBalance.toFixed(2)}. Keep up the great work!`,

    });
}

/**
 * KYC Status Change Notification
 */
export async function notifyKYCStatus(userId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'kyc_status',
        title: status === 'approved' ? '\u2705 KYC Approved' : '\u274c KYC Rejected',
        message: status === 'approved' 
            ? 'Your identity verification has been approved. You can now access all features.'
            : `Your KYC verification was rejected: ${reason || 'Please resubmit with valid documents.'}`,

    });
}

/**
 * Login Attempt Notification (CRITICAL - Security Alert)
 */
export async function notifyLoginAttempt(userId: string, ipAddress: string, location: string, success: boolean): Promise<void> {
    if (!success) {
        // Failed login attempts are critical security alerts
        await createNotification({
            userId,
            type: 'login_attempt',
            title: '\ud83d\udd12 Failed Login Attempt',
            message: `Someone tried to access your account from ${location} (IP: ${ipAddress}). If this wasn't you, change your password immediately.`,
            isCritical: true,
            relatedData: { ipAddress, location, success, timestamp: new Date() },
        });
    }
}

/**
 * Password Changed Notification (CRITICAL - Security Alert)
 */
export async function notifyPasswordChanged(userId: string, ipAddress: string): Promise<void> {
    await createNotification({
        userId,
        type: 'password_changed',
        title: '\ud83d\udd11 Password Changed',
        message: `Your password was changed from IP ${ipAddress}. If you didn't make this change, contact support immediately.`,
        isCritical: true,
        relatedData: { ipAddress, timestamp: new Date() },
    });
}

/**
 * Payment Method Added Notification (CRITICAL - Security Alert)
 */
export async function notifyPaymentMethodAdded(userId: string, last4: string, type: 'card' | 'bank'): Promise<void> {
    await createNotification({
        userId,
        type: 'payment_method_added',
        title: '\ud83d\udcb3 New Payment Method Added',
        message: `A ${type} ending in ${last4} was added to your account. If you didn't add this, remove it immediately.`,
        isCritical: true,

    });
}

/**
 * Payment Method Removed Notification
 */
export async function notifyPaymentMethodRemoved(userId: string, last4: string, type: 'card' | 'bank'): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'payment_method_removed',
        title: '\ud83d\udee1\ufe0f Payment Method Removed',
        message: `Your ${type} ending in ${last4} was removed from your account.`,

    });
}

/**
 * Security Alert Notification (CRITICAL)
 */
export async function notifySecurityAlert(userId: string, alertType: string, message: string, details?: any): Promise<void> {
    await createNotification({
        userId,
        type: 'security_alert',
        title: `\u26a0\ufe0f Security Alert: ${alertType}`,
        message,
        isCritical: true,
        relatedData: { alertType, ...details, timestamp: new Date() },
    });
}

/**
 * Low Balance Warning
 */
export async function notifyLowBalance(userId: string, currentBalance: number, daysRemaining: number, critical: boolean): Promise<void> {
    await createNotification({
        userId,
        type: 'low_balance',
        title: critical ? '\ud83d\udea8 Critical: Low Balance!' : '\u26a0\ufe0f  Warning: Low Balance',
        message: `Your wallet balance ($${currentBalance.toFixed(2)}) will only cover ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} of savings. Add funds to continue your streak!`,
        isCritical: critical,
        relatedData: { currentBalance, daysRemaining },
    });
}

/**
 * Daily Savings Reminder
 */
export async function notifyDailySavingsReminder(userId: string, amount: number, streak: number): Promise<void> {
    await addNotificationJob({
        userId,
        type: 'info',
        title: '\ud83d\udcb0 Daily Savings Reminder',
        message: `Time to save $${amount.toFixed(2)} today! You're on a ${streak}-day streak. Keep it up!`,

    });
}
