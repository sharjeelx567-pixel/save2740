/**
 * Fee Calculation API
 * POST /api/fees/calculate - Calculate fees for a transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateFee } from '@/lib/services/fee-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionType, amount, currency = 'USD' } = body;

    if (!transactionType || !amount) {
      return NextResponse.json(
        { success: false, error: 'Transaction type and amount are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const feeCalculation = await calculateFee(transactionType, amount, currency);

    return NextResponse.json(
      {
        success: true,
        data: feeCalculation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating fee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate fee' },
      { status: 500 }
    );
  }
}
