/**
 * Withdrawal Automation System
 * Processes scheduled withdrawals via ACH (ledger → bank account)
 * 
 * Flow:
 * 1. User requests withdrawal
 * 2. Funds locked in wallet (pendingWithdrawals)
 * 3. ACH initiated via Stripe/Dwolla
 * 4. Upon confirmation, funds deducted from wallet
 * 5. Ledger entry created for audit trail
 */

import mongoose from 'mongoose';
import { Wallet } from '../models/wallet.model';
import User from '../models/User';
import { Transaction } from '../models/transaction.model';
import { PaymentMethod } from '../models/payment-method.model';
import { addNotificationJob } from './job-queue';

interface WithdrawalRequest {
    id: string;
    userId: string;
    amount: number;
    bankAccountId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: Date;
    scheduledFor?: Date;
    processedAt?: Date;
    externalTransactionId?: string;
    failureReason?: string;
}

/**
 * Process all scheduled withdrawals
 */
export async function processScheduledWithdrawals(): Promise<{
    total: number;
    successful: number;
    failed: number;
    details: Array<any>;
}> {
    console.log('💰 [WITHDRAWALS] Starting scheduled withdrawal processing...');

    const result = {
        total: 0,
        successful: 0,
        failed: 0,
        details: [] as Array<any>,
    };

    try {
        // Try to get Withdrawal model - it may not exist yet
        let WithdrawalModel;
        try {
            WithdrawalModel = mongoose.model('Withdrawal');
        } catch {
            console.log('📭 [WITHDRAWALS] Withdrawal model not found, skipping');
            return result;
        }

        const now = new Date();

        const pendingWithdrawals = await WithdrawalModel.find({
            status: 'pending',
            scheduledFor: { $lte: now },
        }).limit(100); // Process in batches

        result.total = pendingWithdrawals.length;
        console.log(`📊 [WITHDRAWALS] Found ${result.total} pending withdrawals`);

        for (const withdrawal of pendingWithdrawals) {
            try {
                const processResult = await processWithdrawal(withdrawal);
                result.details.push(processResult);

                if (processResult.success) {
                    result.successful++;
                } else {
                    result.failed++;
                }
            } catch (error: any) {
                result.failed++;
                result.details.push({
                    withdrawalId: withdrawal.id,
                    userId: withdrawal.userId,
                    success: false,
                    error: error.message,
                });
                console.error(`❌ [WITHDRAWALS] Error processing withdrawal ${withdrawal.id}:`, error);
            }
        }

        console.log(`✅ [WITHDRAWALS] Completed: ${result.successful} successful, ${result.failed} failed`);
        return result;
    } catch (error) {
        console.error('❌ [WITHDRAWALS] Fatal error in withdrawal processing:', error);
        throw error;
    }
}

/**
 * Process a single withdrawal
 */
async function processWithdrawal(withdrawal: any): Promise<{
    withdrawalId: string;
    userId: string;
    success: boolean;
    transactionId?: string;
    error?: string;
}> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, amount, bankAccountId, id: withdrawalId } = withdrawal;

        // Get user's wallet
        const wallet = await Wallet.findOne({ userId }).session(session);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Verify funds are locked
        if (wallet.pendingWithdrawals < amount) {
            throw new Error('Insufficient locked funds');
        }

        // Get bank account details
        const bankAccount = await PaymentMethod.findOne({
            _id: bankAccountId,
            userId,
            type: 'bank_account',
            isActive: true,
        });

        if (!bankAccount) {
            throw new Error('Bank account not found or inactive');
        }

        // **INITIATE ACH PAYOUT**
        // This is where we use Stripe/Dwolla ACH transfer
        const achResult = await initiateACHPayout({
            amount,
            bankAccount: {
                externalId: bankAccount.externalId,
                last4: bankAccount.last4,
                bankName: bankAccount.bankName,
            },
            userId,
            withdrawalId,
        });

        if (!achResult.success) {
            throw new Error(achResult.error || 'ACH payout failed');
        }

        // Update wallet: Deduct from pendingWithdrawals
        wallet.pendingWithdrawals -= amount;
        wallet.totalBalance -= amount; // Also reduce total balance
        await wallet.save({ session });

        // Update withdrawal status
        withdrawal.status = 'processing';
        withdrawal.processedAt = new Date();
        withdrawal.externalTransactionId = achResult.transactionId;
        await withdrawal.save({ session });

        // Create transaction record
        const transaction = await Transaction.create([{
            userId,
            type: 'withdrawal',
            amount,
            status: 'completed',
            description: `ACH Withdrawal to ${bankAccount.bankName} ****${bankAccount.last4}`,
            category: 'withdrawal',
            fee: achResult.fee || 0,
            balanceBefore: wallet.totalBalance + amount,
            balanceAfter: wallet.totalBalance,
            metadata: {
                withdrawalId,
                externalTransactionId: achResult.transactionId,
                bankAccountId,
                processingMethod: 'ACH',
            },
        }], { session });

        await session.commitTransaction();

        // Send notification
        await addNotificationJob({
            userId,
            title: '💰 Withdrawal Processing',
            message: `Your withdrawal of $${amount.toFixed(2)} is being processed. Funds should arrive in 2-3 business days.`,
            type: 'info',
        });

        console.log(`✅ [WITHDRAWALS] Processed withdrawal ${withdrawalId}: $${amount}`);

        return {
            withdrawalId,
            userId,
            success: true,
            transactionId: transaction[0]._id.toString(),
        };

    } catch (error: any) {
        await session.abortTransaction();

        // Update withdrawal status to failed
        try {
            withdrawal.status = 'failed';
            withdrawal.failureReason = error.message;
            await withdrawal.save();
        } catch (saveError) {
            console.error('Failed to save withdrawal failure status:', saveError);
        }

        // Send failure notification
        await addNotificationJob({
            userId: withdrawal.userId,
            title: '❌ Withdrawal Failed',
            message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} could not be processed: ${error.message}`,
            type: 'error',
        });

        return {
            withdrawalId: withdrawal.id,
            userId: withdrawal.userId,
            success: false,
            error: error.message,
        };
    } finally {
        session.endSession();
    }
}

/**
 * Initiate ACH payout via Stripe or Dwolla
 */
async function initiateACHPayout(params: {
    amount: number;
    bankAccount: {
        externalId: string;
        last4: string;
        bankName?: string;
    };
    userId: string;
    withdrawalId: string;
}): Promise<{
    success: boolean;
    transactionId?: string;
    fee?: number;
    error?: string;
}> {
    try {
        // TODO: Integrate with actual Stripe/Dwolla API
        // For now, we'll use a mock implementation

        console.log(`💳 [ACH] Initiating ACH payout: $${params.amount} to account ****${params.bankAccount.last4}`);

        // **STRIPE ACH TRANSFER EXAMPLE**
        /*
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const transfer = await stripe.transfers.create({
          amount: Math.round(params.amount * 100), // Convert to cents
          currency: 'usd',
          destination: params.bankAccount.externalId,
          metadata: {
            userId: params.userId,
            withdrawalId: params.withdrawalId,
          },
        });
        
        return {
          success: true,
          transactionId: transfer.id,
          fee: 0, // ACH is typically free or very low cost
        };
        */

        // **DWOLLA ACH TRANSFER EXAMPLE**
        /*
        const dwolla = require('dwolla-v2');
        const client = new dwolla.Client({
          key: process.env.DWOLLA_KEY,
          secret: process.env.DWOLLA_SECRET,
          environment: 'production',
        });
        
        const transfer = await client.post('transfers', {
          _links: {
            source: { href: SAVE2740_FUNDING_SOURCE_URL },
            destination: { href: params.bankAccount.externalId },
          },
          amount: {
            currency: 'USD',
            value: params.amount.toFixed(2),
          },
          metadata: {
            userId: params.userId,
            withdrawalId: params.withdrawalId,
          },
        });
        
        return {
          success: true,
          transactionId: transfer.headers.get('Location').split('/').pop(),
          fee: 0,
        };
        */

        // Mock implementation for development
        return {
            success: true,
            transactionId: `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fee: 0, // ACH transfers are typically free
        };

    } catch (error: any) {
        console.error('❌ [ACH] Payout failed:', error);
        return {
            success: false,
            error: error.message || 'ACH payout failed',
        };
    }
}

/**
 * User-initiated withdrawal request
 */
export async function requestWithdrawal(params: {
    userId: string;
    amount: number;
    bankAccountId: string;
    scheduledFor?: Date;
}): Promise<{
    success: boolean;
    withdrawalId?: string;
    message?: string;
    error?: string;
}> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, amount, bankAccountId, scheduledFor } = params;

        // Get wallet
        const wallet = await Wallet.findOne({ userId }).session(session);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Check available balance (locked funds can be withdrawn)
        const availableForWithdrawal = wallet.locked + wallet.availableBalance;
        if (availableForWithdrawal < amount) {
            throw new Error(`Insufficient funds. Available: $${availableForWithdrawal.toFixed(2)}`);
        }

        // Verify bank account
        const bankAccount = await PaymentMethod.findOne({
            _id: bankAccountId,
            userId,
            type: 'bank_account',
            isActive: true,
        });

        if (!bankAccount) {
            throw new Error('Invalid or inactive bank account');
        }

        // Lock funds for withdrawal
        const amountFromLocked = Math.min(wallet.locked, amount);
        const amountFromAvailable = amount - amountFromLocked;

        wallet.locked -= amountFromLocked;
        wallet.availableBalance -= amountFromAvailable;
        wallet.pendingWithdrawals += amount;

        await wallet.save({ session });

        // Create withdrawal request
        const WithdrawalModel = mongoose.model('Withdrawal');
        const withdrawal = await WithdrawalModel.create([{
            userId,
            amount,
            bankAccountId,
            status: 'pending',
            requestedAt: new Date(),
            scheduledFor: scheduledFor || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default: next day
        }], { session });

        await session.commitTransaction();

        // Send confirmation
        await addNotificationJob({
            userId,
            title: '📤 Withdrawal Requested',
            message: `Your withdrawal of $${amount.toFixed(2)} has been scheduled. Funds will be processed within 1-2 business days.`,
            type: 'info',
        });

        console.log(`✅ [WITHDRAWALS] Withdrawal requested: ${withdrawal[0]._id}`);

        return {
            success: true,
            withdrawalId: withdrawal[0]._id.toString(),
            message: 'Withdrawal request created successfully',
        };

    } catch (error: any) {
        await session.abortTransaction();
        return {
            success: false,
            error: error.message || 'Failed to request withdrawal',
        };
    } finally {
        session.endSession();
    }
}
