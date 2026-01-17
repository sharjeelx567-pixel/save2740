/**
 * Wallet Top-Up URL API
 * GET /api/wallet/top-up-url - Get wallet top-up URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Wallet } from '@/lib/models/wallet.model';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
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

    await connectDB();

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Get top-up URL from wallet or environment
    const topUpUrl =
      wallet.walletTopUpUrl ||
      process.env.WALLET_TOPUP_URL ||
      process.env.EXTERNAL_WALLET_URL ||
      '#';

    return NextResponse.json(
      {
        success: true,
        data: {
          topUpUrl,
          currentBalance: wallet.availableBalance,
          autoTopUpEnabled: wallet.autoTopUpEnabled,
          autoTopUpThreshold: wallet.autoTopUpThreshold,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching top-up URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top-up URL' },
      { status: 500 }
    );
  }
}
