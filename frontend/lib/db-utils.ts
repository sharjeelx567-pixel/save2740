/**
 * Database Utilities & Helpers
 * Helper functions for common database operations
 */

import { connectDB } from './db';
import { Transaction, ITransaction } from './models/transaction';
import { SavingPlan, ISavingPlan } from './models/saving-plan';

/**
 * Create a new transaction record
 */
export async function createTransaction(data: Partial<ITransaction>): Promise<ITransaction> {
  await connectDB();
  const transaction = await Transaction.create({
    ...data,
    transactionId: `txn_${Date.now()}`,
    createdAt: new Date(),
  });
  return transaction;
}

/**
 * Get user's transactions with filtering
 */
export async function getUserTransactions(
  userId: string,
  filters?: {
    type?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<{ transactions: ITransaction[]; total: number }> {
  await connectDB();

  const query: any = { userId };
  if (filters?.type && filters.type !== 'all') {
    query.type = filters.type;
  }
  if (filters?.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  const total = await Transaction.countDocuments(query);
  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .limit(filters?.limit || 10)
    .skip(filters?.skip || 0)
    .lean();

  return { transactions: transactions as unknown as ITransaction[], total };
}

/**
 * Get user's saving plans
 */
export async function getUserSavingPlans(
  userId: string,
  status?: string
): Promise<ISavingPlan[]> {
  await connectDB();

  const query: any = { userId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const plans = await SavingPlan.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return plans as unknown as ISavingPlan[];
}

/**
 * Create a new saving plan
 */
export async function createSavingPlan(
  userId: string,
  data: Partial<ISavingPlan>
): Promise<ISavingPlan> {
  await connectDB();

  const plan = await SavingPlan.create({
    ...data,
    userId,
    currentAmount: 0,
    totalContributions: 0,
    contributionCount: 0,
    createdAt: new Date(),
  });

  return plan;
}

/**
 * Update user's wallet balance - To be implemented when User model is properly exported
 */

/**
 * Get user wallet summary - To be implemented when User model is properly exported
 */

/**
 * Record a transaction and update wallet balance - To be implemented when User model is properly exported
 */

/**
 * Cancel/refund a transaction - To be implemented when User model is properly exported
 */

export default {
  createTransaction,
  getUserTransactions,
  getUserSavingPlans,
  createSavingPlan,
};
