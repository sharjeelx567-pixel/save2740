/**
 * Fee Calculation Service
 * Transparent fee calculation and disclosure
 */

import { FeeDisclosure } from '@/lib/models/fee-disclosure';
import { connectDB } from '@/lib/db';

export interface FeeCalculation {
  amount: number;
  fee: number;
  netAmount: number;
  feeBreakdown: {
    percentage?: number;
    fixedAmount?: number;
    totalFee: number;
  };
  disclosure: string;
}

/**
 * Calculate fee for a transaction
 */
export async function calculateFee(
  transactionType: 'deposit' | 'withdrawal' | 'wallet-topup' | 'subscription' | 'pocket-creation' | 'premium-feature',
  amount: number,
  currency: string = 'USD'
): Promise<FeeCalculation> {
  await connectDB();

  const now = new Date();
  const feeDisclosure = await FeeDisclosure.findOne({
    transactionType,
    currency,
    isActive: true,
    effectiveDate: { $lte: now },
    $or: [{ expiryDate: { $gte: now } }, { expiryDate: null }],
  }).sort({ effectiveDate: -1 });

  // Default fee structure if none found
  let fee = 0;
  let feeBreakdown = {
    percentage: 0,
    fixedAmount: 0,
    totalFee: 0,
  };
  let disclosure = 'No fees apply';

  if (feeDisclosure) {
    const { feeStructure } = feeDisclosure;

    if (feeStructure.type === 'percentage') {
      fee = (amount * (feeStructure.percentage || 0)) / 100;
      feeBreakdown.percentage = feeStructure.percentage || 0;
    } else if (feeStructure.type === 'fixed') {
      fee = feeStructure.fixedAmount || 0;
      feeBreakdown.fixedAmount = fee;
    } else if (feeStructure.type === 'percentage-plus-fixed') {
      const percentageFee = (amount * (feeStructure.percentage || 0)) / 100;
      const fixedFee = feeStructure.fixedAmount || 0;
      fee = percentageFee + fixedFee;
      feeBreakdown.percentage = feeStructure.percentage || 0;
      feeBreakdown.fixedAmount = fixedFee;
    }

    // Apply min/max constraints
    if (feeStructure.minimumFee !== undefined && fee < feeStructure.minimumFee) {
      fee = feeStructure.minimumFee;
    }
    if (feeStructure.maximumFee !== undefined && fee > feeStructure.maximumFee) {
      fee = feeStructure.maximumFee;
    }

    feeBreakdown.totalFee = fee;
    disclosure = feeDisclosure.description;
  } else {
    // Default fees for common transaction types
    if (transactionType === 'deposit') {
      fee = (amount * 2.9) / 100 + 0.30; // 2.9% + $0.30
      feeBreakdown = {
        percentage: 2.9,
        fixedAmount: 0.30,
        totalFee: fee,
      };
      disclosure = 'Deposit fee: 2.9% + $0.30 per transaction';
    } else if (transactionType === 'wallet-topup') {
      fee = 0; // No fee for wallet top-up
      disclosure = 'No fees for wallet top-up';
    }
  }

  return {
    amount,
    fee: Math.round(fee * 100) / 100, // Round to 2 decimal places
    netAmount: Math.round((amount - fee) * 100) / 100,
    feeBreakdown,
    disclosure,
  };
}

/**
 * Get fee disclosure for a transaction type
 */
export async function getFeeDisclosure(
  transactionType: 'deposit' | 'withdrawal' | 'wallet-topup' | 'subscription' | 'pocket-creation' | 'premium-feature',
  currency: string = 'USD'
) {
  await connectDB();

  const now = new Date();
  const feeDisclosure = await FeeDisclosure.findOne({
    transactionType,
    currency,
    isActive: true,
    effectiveDate: { $lte: now },
    $or: [{ expiryDate: { $gte: now } }, { expiryDate: null }],
  }).sort({ effectiveDate: -1 });

  if (!feeDisclosure) {
    return {
      transactionType,
      feeStructure: {
        type: 'fixed' as const,
        fixedAmount: 0,
      },
      description: 'No fees apply',
      currency,
    };
  }

  return feeDisclosure;
}

/**
 * Get all active fee disclosures
 */
export async function getAllFeeDisclosures(currency: string = 'USD') {
  await connectDB();

  const now = new Date();
  const disclosures = await FeeDisclosure.find({
    currency,
    isActive: true,
    effectiveDate: { $lte: now },
    $or: [{ expiryDate: { $gte: now } }, { expiryDate: null }],
  }).sort({ transactionType: 1, effectiveDate: -1 });

  return disclosures;
}
