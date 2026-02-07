/**
 * Cleanup Service
 * Cleans up expired sessions, tokens, and stale data.
 * 
 * Runs daily at 4 AM
 */

import mongoose from 'mongoose';
import User from '../models/User';

interface CleanupResult {
    expiredTokens: number;
    staleNotifications: number;
    oldAuditLogs: number;
    tempFiles: number;
    failedTransactions: number;
    totalCleaned: number;
}

/**
 * Clean up expired data across the system
 */
export async function cleanupExpiredData(): Promise<CleanupResult> {
    console.log('🧹 [CLEANUP] Starting data cleanup...');
    const startTime = Date.now();

    const result: CleanupResult = {
        expiredTokens: 0,
        staleNotifications: 0,
        oldAuditLogs: 0,
        tempFiles: 0,
        failedTransactions: 0,
        totalCleaned: 0,
    };

    try {
        // 1. Clean up expired refresh tokens
        result.expiredTokens = await cleanupExpiredTokens();

        // 2. Clean up old read notifications (older than 30 days)
        result.staleNotifications = await cleanupOldNotifications();

        // 3. Clean up old audit logs (older than 90 days)
        result.oldAuditLogs = await cleanupOldAuditLogs();

        // 4. Clean up failed/abandoned transactions (older than 7 days)
        result.failedTransactions = await cleanupFailedTransactions();

        result.totalCleaned = 
            result.expiredTokens + 
            result.staleNotifications + 
            result.oldAuditLogs + 
            result.failedTransactions;

        const duration = Date.now() - startTime;
        console.log(`✅ [CLEANUP] Completed in ${duration}ms`);
        console.log(`📊 [CLEANUP] Total cleaned: ${result.totalCleaned} records`);
        console.log(`   - Expired tokens: ${result.expiredTokens}`);
        console.log(`   - Stale notifications: ${result.staleNotifications}`);
        console.log(`   - Old audit logs: ${result.oldAuditLogs}`);
        console.log(`   - Failed transactions: ${result.failedTransactions}`);

        return result;
    } catch (error) {
        console.error('❌ [CLEANUP] Error during cleanup:', error);
        throw error;
    }
}

/**
 * Clean up expired refresh tokens from users
 */
async function cleanupExpiredTokens(): Promise<number> {
    try {
        const now = new Date();
        
        // Remove expired tokens from all users
        const result = await User.updateMany(
            { 'refreshTokens.expiresAt': { $lt: now } },
            { $pull: { refreshTokens: { expiresAt: { $lt: now } } } }
        );

        console.log(`🔑 [CLEANUP] Removed expired tokens from ${result.modifiedCount} users`);
        return result.modifiedCount;
    } catch (error) {
        console.error('❌ [CLEANUP] Error cleaning expired tokens:', error);
        return 0;
    }
}

/**
 * Clean up old read notifications
 */
async function cleanupOldNotifications(): Promise<number> {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Try to get Notification model
        let Notification;
        try {
            Notification = mongoose.model('Notification');
        } catch {
            console.log('📭 [CLEANUP] Notification model not found, skipping');
            return 0;
        }

        const result = await Notification.deleteMany({
            read: true,
            createdAt: { $lt: thirtyDaysAgo },
        });

        console.log(`📭 [CLEANUP] Removed ${result.deletedCount} old read notifications`);
        return result.deletedCount;
    } catch (error) {
        console.error('❌ [CLEANUP] Error cleaning old notifications:', error);
        return 0;
    }
}

/**
 * Clean up old audit logs
 */
async function cleanupOldAuditLogs(): Promise<number> {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Try to get AuditLog model
        let AuditLog;
        try {
            AuditLog = mongoose.model('AuditLog');
        } catch {
            console.log('📋 [CLEANUP] AuditLog model not found, skipping');
            return 0;
        }

        const result = await AuditLog.deleteMany({
            createdAt: { $lt: ninetyDaysAgo },
        });

        console.log(`📋 [CLEANUP] Removed ${result.deletedCount} old audit logs`);
        return result.deletedCount;
    } catch (error) {
        console.error('❌ [CLEANUP] Error cleaning old audit logs:', error);
        return 0;
    }
}

/**
 * Clean up old failed/abandoned transactions
 */
async function cleanupFailedTransactions(): Promise<number> {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Try to get Transaction model
        let Transaction;
        try {
            Transaction = mongoose.model('Transaction');
        } catch {
            console.log('💳 [CLEANUP] Transaction model not found, skipping');
            return 0;
        }

        // Only delete failed/cancelled transactions, not completed ones
        const result = await Transaction.deleteMany({
            status: { $in: ['failed', 'cancelled', 'abandoned'] },
            createdAt: { $lt: sevenDaysAgo },
        });

        console.log(`💳 [CLEANUP] Removed ${result.deletedCount} old failed transactions`);
        return result.deletedCount;
    } catch (error) {
        console.error('❌ [CLEANUP] Error cleaning failed transactions:', error);
        return 0;
    }
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupPasswordResetTokens(): Promise<number> {
    try {
        const now = new Date();
        
        const result = await User.updateMany(
            { passwordResetExpires: { $lt: now } },
            { 
                $unset: { 
                    passwordResetToken: 1, 
                    passwordResetExpires: 1 
                } 
            }
        );

        console.log(`🔐 [CLEANUP] Cleared expired password reset tokens from ${result.modifiedCount} users`);
        return result.modifiedCount;
    } catch (error) {
        console.error('❌ [CLEANUP] Error cleaning password reset tokens:', error);
        return 0;
    }
}
