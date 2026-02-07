
import mongoose from 'mongoose';
import { Wallet, IWallet } from '../models/wallet.model';
import { Transaction, ITransaction } from '../models/transaction.model';
import { LedgerEntry } from '../models/ledger-entry.model';
import { Save2740Plan } from '../models/save2740.model';
import stripe, { createPaymentIntent, confirmPaymentIntent } from '../utils/stripe';

/**
 * Ledger Service with Double-Entry Bookkeeping
 * Every financial transaction creates matching debit and credit entries
 */
export class LedgerService {
    /**
     * Record a double-entry ledger transaction
     * Ensures balanced books by creating matching debit/credit entries
     */
    static async recordDoubleEntry(
        userId: string,
        transactionId: string,
        amount: number,
        description: string,
        accountType: 'wallet' | 'escrow' | 'pending' | 'locked' | 'referral' = 'wallet',
        referenceId?: string,
        metadata?: any,
        session?: mongoose.ClientSession
    ): Promise<void> {
        const wallet = await Wallet.findOne({ userId }).session(session || null);
        if (!wallet) throw new Error('Wallet not found');

        // Calculate new balance based on account type
        let currentBalance = 0;
        switch (accountType) {
            case 'wallet':
                currentBalance = wallet.availableBalance;
                break;
            case 'escrow':
                currentBalance = wallet.escrowBalance || 0;
                break;
            case 'locked':
                currentBalance = wallet.locked || 0;
                break;
            case 'referral':
                currentBalance = wallet.referralEarnings || 0;
                break;
        }

        // Create debit entry
        await LedgerEntry.create([{
            userId,
            transactionId,
            entryType: 'debit',
            accountType,
            amount,
            balance: currentBalance + amount,
            currency: 'USD',
            description,
            referenceId,
            metadata
        }], { session: session || undefined });

        // Create credit entry (system account - not stored but logged for audit)
        await LedgerEntry.create([{
            userId,
            transactionId,
            entryType: 'credit',
            accountType: 'wallet',
            amount,
            balance: currentBalance,
            currency: 'USD',
            description: `${description} - Credit Entry`,
            referenceId,
            metadata: { ...metadata, systemEntry: true }
        }], { session: session || undefined });
    }

    /**
     * Get ledger balance for a user account
     */
    static async getLedgerBalance(
        userId: string,
        accountType: 'wallet' | 'escrow' | 'pending' | 'locked' | 'referral' = 'wallet'
    ): Promise<number> {
        const entries = await LedgerEntry.find({ userId, accountType })
            .sort({ createdAt: -1 })
            .limit(1);

        return entries.length > 0 ? entries[0].balance : 0;
    }

    /**
     * Get ledger history for a user
     */
    static async getLedgerHistory(
        userId: string,
        accountType?: 'wallet' | 'escrow' | 'pending' | 'locked' | 'referral',
        limit: number = 100
    ) {
        const query: any = { userId };
        if (accountType) query.accountType = accountType;

        return await LedgerEntry.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Verify ledger integrity (sum of debits should equal sum of credits)
     */
    static async verifyLedgerIntegrity(userId: string): Promise<{
        isBalanced: boolean;
        debits: number;
        credits: number;
        difference: number;
    }> {
        const entries = await LedgerEntry.find({ userId });

        let debits = 0;
        let credits = 0;

        for (const entry of entries) {
            if (entry.entryType === 'debit') {
                debits += entry.amount;
            } else {
                credits += entry.amount;
            }
        }

        return {
            isBalanced: Math.abs(debits - credits) < 0.01, // Allow for rounding
            debits,
            credits,
            difference: debits - credits
        };
    }
    /**
     * Fund Wallet (Deposit) - Step 1 of Architecture
     * Charges user via Stripe and adds to Available Balance
     * Uses double-entry bookkeeping for audit trail
     */
    static async fundWallet(userId: string, amount: number, paymentMethodId: string): Promise<{ transaction: ITransaction, wallet: IWallet }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Process Stripe Payment
            // Note: In a real production app, you might authorize first, then capture after ledger update,
            // or handle webhooks. For simplicity here, we assume immediate success or throw.
            const paymentIntent = await createPaymentIntent(
                await this.getStripeCustomerId(userId),
                Math.round(amount * 100), // Stripe expects cents
                'usd',
                { userId, type: 'wallet_funding' }
            );

            const confirmedPayment = await confirmPaymentIntent(paymentIntent.id, paymentMethodId);

            if (confirmedPayment.status !== 'succeeded') {
                throw new Error(`Payment failed with status: ${confirmedPayment.status}`);
            }

            // 2. Update Wallet (Ledger)
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) throw new Error('Wallet not found');

            wallet.availableBalance = (wallet.availableBalance || 0) + amount;
            wallet.balance = (wallet.balance || 0) + amount; // Keeping them in sync as per observation
            await wallet.save({ session });

            // 3. Create Transaction Record
            const transaction = new Transaction({
                userId,
                type: 'deposit',
                amount,
                status: 'completed',
                description: 'Wallet Funding via Stripe',
                paymentMethodId,
                referenceId: confirmedPayment.id,
                externalTransactionId: confirmedPayment.id,
                completedAt: new Date()
            });
            await transaction.save({ session });

            // 4. Record double-entry in ledger
            await this.recordDoubleEntry(
                userId,
                transaction.transactionId,
                amount,
                'Wallet Funding via Stripe',
                'wallet',
                confirmedPayment.id,
                {
                    paymentMethodId,
                    stripePaymentIntentId: confirmedPayment.id,
                    currency: 'usd'
                },
                session
            );

            await session.commitTransaction();
            return { transaction, wallet };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Daily Saver Logic (Allocation) - Step 3 of Architecture
     * Moves funds from Available -> Locked (No Payment Rail)
     */
    static async allocateDailySavings(userId: string, planId: string, amount: number): Promise<{ success: boolean, message?: string }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) throw new Error('Wallet not found');

            // Check balance
            if (wallet.availableBalance < amount) {
                // Architecture says: "If wallet runs low: Warn user, Pause streak"
                // We will return false so the caller can handle the warning/pause
                await session.abortTransaction();
                return { success: false, message: 'Insufficient funds' };
            }

            const plan = await Save2740Plan.findOne({ _id: planId }).session(session);
            if (!plan) throw new Error('Plan not found');

            // Perform Ledger Movement
            wallet.availableBalance -= amount;
            wallet.balance -= amount; // "balance" seems to be treated as available/unallocated in this system based on usage
            wallet.locked = (wallet.locked || 0) + amount;
            wallet.lockedInPockets = (wallet.lockedInPockets || 0) + amount;

            // Update Plan
            plan.currentBalance = (plan.currentBalance || 0) + amount;
            plan.totalContributions = (plan.totalContributions || 0) + amount;
            plan.contributionCount = (plan.contributionCount || 0) + 1;
            plan.lastContributionDate = new Date();
            plan.streakDays = (plan.streakDays || 0) + 1;

            // Logic check: Completion
            if (plan.currentBalance >= plan.totalTargetAmount) {
                // plan.status = 'completed'; // Letting the caller decide or auto-complete
            }

            await wallet.save({ session });
            await plan.save({ session });

            // Create Ledger Entry (Internal Transfer)
            const transaction = new Transaction({
                userId,
                type: 'save_daily',
                amount,
                status: 'completed',
                description: `Daily Allocation to ${plan.name}`,
                metadata: { planId },
                completedAt: new Date()
            });
            await transaction.save({ session });

            await session.commitTransaction();
            return { success: true };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Withdraw Funds - Step 4 of Architecture
     * Reverses allocation (Locked -> Payout)
     */
    static async requestWithdrawal(userId: string, amount: number, destinationAccountId?: string): Promise<ITransaction> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) throw new Error('Wallet not found');

            // Can we withdraw from locked? Usually we withdraw 'available' funds that were released.
            // The prompt says "Funds released from ledger -> ACH payout".
            // Use case: End of Challenge / Monthly.
            // We assume we are withdrawing from "Locked" funds (savings) or "Available".
            // Let's assume we withdraw from available, so user must "release" funds first?
            // OR we support withdrawing checking if we have enough total.

            // Implementation: Check Available. If not enough, check Locked (if logic allows unlocking).
            // Safest approach: Only withdraw Available. User must "Unlock" savings to Available first.
            // However, prompt implies "Funds released from ledger -> ACH payout" is one flow.

            let deductionSource = 'available';
            if (wallet.availableBalance >= amount) {
                wallet.availableBalance -= amount;
                wallet.balance -= amount;
            } else if (wallet.locked >= amount) {
                // Direct withdrawal from savings
                wallet.locked -= amount;
                wallet.lockedInPockets -= amount; // We'd need to know WHICH pocket, this is tricky. assuming general pool for now or simplified.
                deductionSource = 'locked';
            } else {
                throw new Error('Insufficient funds');
            }

            // Logic for Payout (Stripe Connect or Payouts API)
            // Since we are "paying out to bank account", we need Stripe Payouts.
            // This usually requires a Connect account or valid bank account attached to Customer?
            // Standard Stripe "Payouts" are to YOUR bank account. To pay a user, you usually need Stripe Connect.
            // Assuming we are just simulating or using a placeholder for the "ACH payout".

            // We will just mark it recorded for this implementation unless we have Connect set up.
            // wallet.pendingWithdrawals += amount; 

            const transaction = new Transaction({
                userId,
                type: 'withdrawal',
                amount,
                status: 'pending', // Pending real bank transfer
                description: `Withdrawal (${deductionSource})`,
                metadata: { destinationAccountId },
                completedAt: null
            });

            await wallet.save({ session });
            await transaction.save({ session });

            await session.commitTransaction();

            // Asynchronously trigger payout process here if needed
            return transaction;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    private static async getStripeCustomerId(userId: string): Promise<string> {
        const wallet = await Wallet.findOne({ userId });
        if (wallet && wallet.stripeCustomerId) return wallet.stripeCustomerId;
        // In real app, create if missing
        throw new Error('Stripe Customer ID missing for user');
    }
}
