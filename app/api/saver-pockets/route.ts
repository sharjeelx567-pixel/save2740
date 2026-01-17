import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SaverPocket } from '@/lib/models/saver-pocket';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get token from httpOnly cookie or Authorization header
    let token = request.cookies.get('authToken')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT token
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch all saver pockets for the user
    const pockets = await SaverPocket.find({ userId, status: 'active' }).sort({ createdAt: -1 }).lean();

    const formattedPockets = pockets.map((pocket: any) => {
      const contributionAmount = pocket.mode === 'daily' 
        ? pocket.baseAmount 
        : pocket.baseAmount / 30; // Monthly amount converted to daily equivalent
      const actualAmount = contributionAmount * pocket.multiplier;

      return {
        id: pocket._id.toString(),
        name: pocket.name,
        description: pocket.description,
        multiplier: pocket.multiplier,
        mode: pocket.mode,
        contributionAmount: actualAmount.toFixed(2),
        baseAmount: pocket.baseAmount,
        saved: pocket.currentBalance.toFixed(2),
        progress: pocket.targetAmount > 0 
          ? Math.min(100, Math.round((pocket.currentBalance / pocket.targetAmount) * 100)) 
          : 0,
        targetAmount: pocket.targetAmount.toFixed(2),
        startDate: pocket.startDate,
        targetCompletionDate: pocket.targetCompletionDate,
        completionDate: pocket.completionDate,
        status: pocket.status,
        autoFund: pocket.autoFund,
        walletPaymentEnabled: pocket.walletPaymentEnabled,
        subscriptionFee: pocket.subscriptionFee,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        pockets: formattedPockets,
        total: formattedPockets.length,
      },
    });
  } catch (error) {
    console.error('Error fetching saver pockets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saver pockets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get token from httpOnly cookie or Authorization header
    let token = request.cookies.get('authToken')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT token
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { 
      name, 
      description,
      baseAmount, 
      multiplier, 
      mode,
      targetAmount,
      autoFund,
      walletPaymentEnabled,
      subscriptionFee
    } = await request.json();

    if (!name || !baseAmount || !targetAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: name, baseAmount, targetAmount' },
        { status: 400 }
      );
    }

    // Validate multiplier (1-10)
    const multiplierValue = Math.max(1, Math.min(10, parseInt(multiplier) || 1));
    const modeValue = mode === 'monthly' ? 'monthly' : 'daily';

    // Calculate target completion date based on mode
    const startDate = new Date();
    const baseDailyAmount = modeValue === 'daily' ? baseAmount : baseAmount / 30;
    const actualDailyAmount = baseDailyAmount * multiplierValue;
    const daysNeeded = Math.ceil(targetAmount / actualDailyAmount);
    const targetCompletionDate = new Date(startDate);
    targetCompletionDate.setDate(targetCompletionDate.getDate() + daysNeeded);
    
    // Create new saver pocket
    const newPocket = await SaverPocket.create({
      userId,
      name,
      description,
      baseAmount: parseFloat(baseAmount),
      multiplier: multiplierValue,
      mode: modeValue,
      targetAmount: parseFloat(targetAmount),
      currentBalance: 0,
      status: 'active',
      startDate,
      targetCompletionDate,
      totalContributions: 0,
      contributionCount: 0,
      autoFund: autoFund || false,
      walletPaymentEnabled: walletPaymentEnabled !== false, // Default true
      subscriptionFee: subscriptionFee ? parseFloat(subscriptionFee) : undefined,
    });

    const contributionAmount = modeValue === 'daily' 
      ? newPocket.baseAmount 
      : newPocket.baseAmount / 30;
    const actualAmount = contributionAmount * newPocket.multiplier;

    const pocket = {
      id: newPocket._id.toString(),
      name: newPocket.name,
      description: newPocket.description,
      multiplier: newPocket.multiplier,
      mode: newPocket.mode,
      contributionAmount: actualAmount.toFixed(2),
      baseAmount: newPocket.baseAmount,
      saved: newPocket.currentBalance.toFixed(2),
      progress: 0,
      targetAmount: newPocket.targetAmount.toFixed(2),
      startDate: newPocket.startDate,
      targetCompletionDate: newPocket.targetCompletionDate,
      autoFund: newPocket.autoFund,
      walletPaymentEnabled: newPocket.walletPaymentEnabled,
      subscriptionFee: newPocket.subscriptionFee,
    };

    return NextResponse.json({
      success: true,
      data: pocket,
    });
  } catch (error) {
    console.error('Error creating saver pocket:', error);
    return NextResponse.json(
      { error: 'Failed to create saver pocket' },
      { status: 500 }
    );
  }
}
