/**
 * Wallet Payment API
 * POST /api/wallet/pay - Pay for Save2740 features using wallet balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Wallet } from '@/lib/models/wallet.model';
import { Transaction } from '@/lib/models/transaction';
import jwt from 'jsonwebtoken';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/services/audit-service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, purpose, description, metadata } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!purpose) {
      return NextResponse.json(
        { success: false, error: 'Payment purpose is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Check if wallet payment is enabled
    if (!wallet.walletPaymentEnabled) {
      return NextResponse.json(
        { success: false, error: 'Wallet payments are disabled for this account' },
        { status: 403 }
      );
    }

    // Check balance
    if (wallet.availableBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient wallet balance',
          data: {
            required: amount,
            available: wallet.availableBalance,
            topUpUrl: wallet.walletTopUpUrl || process.env.WALLET_TOPUP_URL || '#',
          },
        },
        { status: 400 }
      );
    }

    // Deduct from wallet
    const balanceBefore = wallet.availableBalance;
    wallet.availableBalance -= amount;
    wallet.totalBalance = wallet.balance + wallet.locked + wallet.referralEarnings;
    await wallet.save();

    // Create transaction record
    const transactionId = `wallet_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = await Transaction.create({
      userId,
      type: 'transfer',
      amount: Math.round(amount * 100), // Store in cents
      currency: 'USD',
      status: 'completed',
      transactionId,
      description: description || `Wallet payment: ${purpose}`,
      balanceBefore: Math.round(balanceBefore * 100),
      balanceAfter: Math.round(wallet.availableBalance * 100),
      netAmount: Math.round(amount * 100),
      fee: 0, // No fee for wallet payments
      metadata: {
        purpose,
        ...metadata,
      },
      completedAt: new Date(),
    });

    // Audit log
    await logAuditEvent({
      userId,
      action: 'wallet_payment',
      resourceType: 'wallet',
      resourceId: wallet._id.toString(),
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      changes: [
        {
          field: 'availableBalance',
          oldValue: balanceBefore,
          newValue: wallet.availableBalance,
        },
      ],
      metadata: {
        amount,
        purpose,
        transactionId,
      },
      severity: 'info',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          transactionId,
          amount,
          newBalance: wallet.availableBalance,
          transaction: {
            id: transaction._id.toString(),
            status: transaction.status,
            completedAt: transaction.completedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Wallet payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process wallet payment' },
      { status: 500 }
    );
  }
}
