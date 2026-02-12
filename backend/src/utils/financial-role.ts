/**
 * Financial Role (XKori) – behavior-based user classification
 * Derived from real activity: savings wallet + group contributions.
 * Do NOT use signup intent or static labels.
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction';
import { Group } from '../models/group.model';

export type FinancialRole = 'inactive' | 'saver' | 'contribution_member' | 'saver_and_contribution_member';

const ROLE_LABELS: Record<FinancialRole, string> = {
  inactive: 'Inactive',
  saver: 'Saver',
  contribution_member: 'Contribution Member',
  saver_and_contribution_member: 'Saver & Contribution Member',
};

export function getFinancialRoleLabel(role: FinancialRole): string {
  return ROLE_LABELS[role] || 'Inactive';
}

/**
 * Compute user's financial role from actual data (wallet, transactions, group membership).
 */
export async function getFinancialRole(userId: string): Promise<FinancialRole> {
  await connectDB();

  const [hasSavingsActivity, hasContributionActivity] = await Promise.all([
    hasSavingsActivityForUser(userId),
    hasContributionActivityForUser(userId),
  ]);

  if (hasSavingsActivity && hasContributionActivity) return 'saver_and_contribution_member';
  if (hasSavingsActivity) return 'saver';
  if (hasContributionActivity) return 'contribution_member';
  return 'inactive';
}

async function hasSavingsActivityForUser(userId: string): Promise<boolean> {
  const wallet = await Wallet.findOne({ userId });
  if (wallet && (wallet.balance > 0 || (wallet.availableBalance ?? 0) > 0)) return true;

  const count = await Transaction.countDocuments({
    userId,
    status: 'completed',
    type: { $in: ['deposit', 'withdrawal', 'transfer', 'savings-contribution', 'refund'] },
  });
  return count > 0;
}

async function hasContributionActivityForUser(userId: string): Promise<boolean> {
  const count = await Group.countDocuments({
    'members.userId': userId,
  });
  return count > 0;
}

/**
 * Batch compute financial roles for many users (e.g. admin user list).
 */
export async function getFinancialRolesForUserIds(userIds: string[]): Promise<Record<string, FinancialRole>> {
  if (userIds.length === 0) return {};
  await connectDB();

  const [walletsWithBalance, usersWithTx, usersInGroups] = await Promise.all([
    Wallet.find({ userId: { $in: userIds }, $or: [{ balance: { $gt: 0 } }, { availableBalance: { $gt: 0 } }] }).select('userId').lean(),
    Transaction.aggregate<{ _id: string }>([
      { $match: { userId: { $in: userIds }, status: 'completed', type: { $in: ['deposit', 'withdrawal', 'transfer', 'savings-contribution', 'refund'] } } },
      { $group: { _id: '$userId' } },
    ]),
    Group.aggregate<{ _id: mongoose.Types.ObjectId }>([
      { $unwind: '$members' },
      { $match: { 'members.userId': { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: '$members.userId' } },
    ]),
  ]);

  const hasSavings = new Set<string>([
    ...walletsWithBalance.map((w: any) => w.userId?.toString()).filter(Boolean),
    ...usersWithTx.map((r) => r._id),
  ]);
  const hasContribution = new Set(usersInGroups.map((r) => (r._id ? String(r._id) : '')).filter(Boolean));

  const result: Record<string, FinancialRole> = {};
  for (const uid of userIds) {
    const s = hasSavings.has(uid);
    const c = hasContribution.has(uid);
    if (s && c) result[uid] = 'saver_and_contribution_member';
    else if (s) result[uid] = 'saver';
    else if (c) result[uid] = 'contribution_member';
    else result[uid] = 'inactive';
  }
  return result;
}
