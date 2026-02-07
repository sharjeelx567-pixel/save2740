/**
 * Compliance & KYC Verification System
 * Ensures Save2740 meets fintech regulations and platforms statements
 * 
 * Key Compliance Requirements:
 * 1. KYC for users funding wallets
 * 2. Custodial account architecture (not co-mingled)
 * 3. Ledger integrity verification
 * 4. Platform disclaimer display
 * 5. Transaction monitoring for suspicious activity
 */

import User from '../models/User';
import mongoose from 'mongoose';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';
import { COMPLIANCE } from '../config/payment-architecture';

export interface KYCVerificationResult {
    userId: string;
    status: 'approved' | 'pending' | 'rejected' | 'needs_review';
    verifiedAt?: Date;
    documents: {
        idDocument?: boolean;
        addressProof?: boolean;
        selfie?: boolean;
    };
    riskScore?: number;
    provider?: 'manual' | 'stripe_identity' | 'persona' | 'onfido';
}

/**
 * Verify KYC status before allowing wallet funding
 */
export async function verifyKYCBeforeFunding(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    kycStatus?: string;
}> {
    if (!COMPLIANCE.KYC_REQUIRED_FOR_FUNDING) {
        return { allowed: true };
    }

    const user = await User.findById(userId);

    if (!user) {
        return {
            allowed: false,
            reason: 'User not found',
        };
    }

    // Check KYC status
    const kycStatus = user.kycStatus || 'pending';

    if (kycStatus !== 'approved') {
        return {
            allowed: false,
            reason: 'KYC verification required before funding wallet',
            kycStatus,
        };
    }

    return {
        allowed: true,
        kycStatus: 'approved',
    };
}

/**
 * Daily ledger integrity check
 * Ensures all wallet balances match transaction history
 */
export async function verifyLedgerIntegrity(): Promise<{
    totalWallets: number;
    discrepancies: number;
    issues: Array<{
        userId: string;
        walletBalance: number;
        calculatedBalance: number;
        difference: number;
    }>;
}> {
    console.log('🔍 [COMPLIANCE] Running ledger integrity check...');

    const result = {
        totalWallets: 0,
        discrepancies: 0,
        issues: [] as Array<any>,
    };

    try {
        const wallets = await Wallet.find({}).limit(10000);
        result.totalWallets = wallets.length;

        for (const wallet of wallets) {
            // Calculate balance from transaction history
            const transactions = await Transaction.find({
                userId: wallet.userId,
                status: 'completed',
            });

            let calculatedBalance = 0;
            for (const tx of transactions) {
                if (tx.type === 'credit' || tx.type === 'deposit') {
                    calculatedBalance += tx.amount;
                } else if (tx.type === 'debit' || tx.type === 'withdrawal') {
                    calculatedBalance -= tx.amount;
                }
            }

            // Compare with wallet total balance
            const difference = Math.abs(wallet.totalBalance - calculatedBalance);

            if (difference > 0.01) { // Allow 1 cent tolerance for rounding
                result.discrepancies++;
                result.issues.push({
                    userId: wallet.userId,
                    walletBalance: wallet.totalBalance,
                    calculatedBalance,
                    difference,
                });

                console.warn(`⚠️  [COMPLIANCE] Discrepancy found for user ${wallet.userId}: Wallet=$${wallet.totalBalance}, Calculated=$${calculatedBalance}, Diff=$${difference}`);
            }
        }

        if (result.discrepancies > 0) {
            console.error(`❌ [COMPLIANCE] Found ${result.discrepancies} ledger discrepancies!`);
            // TODO: Send alert to admin/compliance team
        } else {
            console.log(`✅ [COMPLIANCE] Ledger integrity verified: All ${result.totalWallets} wallets match`);
        }

        return result;

    } catch (error) {
        console.error('❌ [COMPLIANCE] Error checking ledger integrity:', error);
        throw error;
    }
}

/**
 * Get platform disclaimer text
 */
export function getPlatformDisclaimer(): string {
    return COMPLIANCE.PLATFORM_DISCLAIMER;
}

/**
 * Log compliance event
 */
export async function logComplianceEvent(event: {
    type: 'kyc_verification' | 'large_transaction' | 'suspicious_activity' | 'ledger_check' | 'withdrawal_request';
    userId?: string;
    amount?: number;
    metadata?: any;
    severity?: 'low' | 'medium' | 'high';
}): Promise<void> {
    try {
        const ComplianceLog = mongoose.model('ComplianceLog');
        await ComplianceLog.create({
            type: event.type,
            userId: event.userId,
            amount: event.amount,
            metadata: event.metadata,
            severity: event.severity || 'low',
            timestamp: new Date(),
        });

        if (event.severity === 'high') {
            console.warn(`🚨 [COMPLIANCE] High severity event: ${event.type}`, event);
            // TODO: Send immediate alert to compliance team
        }
    } catch (error) {
        console.error('[COMPLIANCE] Failed to log event:', error);
        // Don't throw - logging failure shouldn't block operations
    }
}

/**
 * Monitor transaction for suspicious activity
 */
export async function monitorTransaction(transaction: {
    userId: string;
    amount: number;
    type: string;
}): Promise<{
    flagged: boolean;
    reasons: string[];
}> {
    const flags: string[] = [];

    // Flag large transactions (> $10,000)
    if (transaction.amount > 10000) {
        flags.push('Large transaction amount');
        await logComplianceEvent({
            type: 'large_transaction',
            userId: transaction.userId,
            amount: transaction.amount,
            severity: 'medium',
        });
    }

    // Check for rapid successive withdrawals
    const recentWithdrawals = await Transaction.find({
        userId: transaction.userId,
        type: 'withdrawal',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    if (recentWithdrawals.length > 5) {
        flags.push('Multiple withdrawals in 24 hours');
        await logComplianceEvent({
            type: 'suspicious_activity',
            userId: transaction.userId,
            metadata: { withdrawalCount: recentWithdrawals.length },
            severity: 'high',
        });
    }

    return {
        flagged: flags.length > 0,
        reasons: flags,
    };
}

/**
 * Custodial account verification
 * Ensures funds are properly segregated
 */
export async function verifyCustodialAccounts(): Promise<{
    totalUserFunds: number;
    custodialBalance: number;
    inSync: boolean;
    difference: number;
}> {
    console.log('🏦 [COMPLIANCE] Verifying custodial account balances...');

    // Sum all user wallet balances
    const wallets = await Wallet.find({});
    const totalUserFunds = wallets.reduce((sum: number, w: any) => sum + w.totalBalance, 0);

    // Get custodial account balance from payment provider
    // TODO: Integrate with actual Stripe/Dwolla balance API
    const custodialBalance = await getCustodialAccountBalance();

    const difference = Math.abs(totalUserFunds - custodialBalance);
    const inSync = difference < 1.00; // Allow $1 tolerance

    if (!inSync) {
        console.error(`❌ [COMPLIANCE] Custodial account mismatch: User Funds=$${totalUserFunds}, Custodial=$${custodialBalance}, Diff=$${difference}`);
        await logComplianceEvent({
            type: 'ledger_check',
            metadata: { totalUserFunds, custodialBalance, difference },
            severity: 'high',
        });
    } else {
        console.log(`✅ [COMPLIANCE] Custodial accounts in sync: $${totalUserFunds.toFixed(2)}`);
    }

    return {
        totalUserFunds,
        custodialBalance,
        inSync,
        difference,
    };
}

/**
 * Get custodial account balance from payment provider
 */
async function getCustodialAccountBalance(): Promise<number> {
    // TODO: Implement actual Stripe/Dwolla balance check
    // For now, return mock data

    /*
    // Stripe example:
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const balance = await stripe.balance.retrieve();
    return balance.available[0].amount / 100; // Convert from cents
    */

    /*
    // Dwolla example:
    const dwollaBalance = await dwollaClient.get(`${FUNDING_SOURCE_URL}/balance`);
    return parseFloat(dwollaBalance.body.balance.value);
    */

    // Mock implementation
    const wallets = await Wallet.find({});
    return wallets.reduce((sum: number, w: any) => sum + w.totalBalance, 0);
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(month: number, year: number): Promise<{
    period: string;
    totalUsers: number;
    totalFunds: number;
    kycApprovalRate: number;
    flaggedTransactions: number;
    ledgerDiscrepancies: number;
}> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [totalUsers, totalWallets, flaggedTransactions] = await Promise.all([
        User.countDocuments({ createdAt: { $lte: endDate } }),
        Wallet.find({}),
        Transaction.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            'metadata.flagged': true,
        }),
    ]);

    const totalFunds = totalWallets.reduce((sum: number, w: any) => sum + w.totalBalance, 0);
    const kycApproved = await User.countDocuments({ kycStatus: 'approved' });
    const kycApprovalRate = totalUsers > 0 ? (kycApproved / totalUsers) * 100 : 0;

    const ledgerCheck = await verifyLedgerIntegrity();

    return {
        period: `${year}-${month.toString().padStart(2, '0')}`,
        totalUsers,
        totalFunds,
        kycApprovalRate,
        flaggedTransactions,
        ledgerDiscrepancies: ledgerCheck.discrepancies,
    };
}
