/**
 * Fee Disclosure API
 * GET /api/fees/disclosure - Get fee disclosures
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllFeeDisclosures, getFeeDisclosure } from '@/lib/services/fee-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionType = searchParams.get('type') as
      | 'deposit'
      | 'withdrawal'
      | 'wallet-topup'
      | 'subscription'
      | 'pocket-creation'
      | 'premium-feature'
      | null;
    const currency = searchParams.get('currency') || 'USD';

    if (transactionType) {
      // Get specific transaction type disclosure
      const disclosure = await getFeeDisclosure(transactionType, currency);
      return NextResponse.json(
        {
          success: true,
          data: disclosure,
        },
        { status: 200 }
      );
    }

    // Get all disclosures
    const disclosures = await getAllFeeDisclosures(currency);
    return NextResponse.json(
      {
        success: true,
        data: {
          disclosures,
          currency,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching fee disclosures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fee disclosures' },
      { status: 500 }
    );
  }
}
