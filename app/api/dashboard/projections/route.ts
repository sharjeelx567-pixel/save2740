/**
 * Dashboard Projections API
 * GET /api/dashboard/projections - Get savings projections and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Save2740Plan } from '@/lib/models/save2740.model';
import { Wallet } from '@/lib/models/wallet.model';
import { calculateProjections, getUserSave2740Stats, DAILY_CHALLENGE_AMOUNT, YEARLY_TARGET } from '@/lib/services/save2740-service';
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

    // Get wallet
    const wallet = await Wallet.findOne({ userId });
    const walletBalance = wallet?.availableBalance || 0;

    // Get Save2740 stats
    const save2740Stats = await getUserSave2740Stats(userId);

    // Get active plans with projections
    const activePlans = await Save2740Plan.find({ userId, status: 'active' });
    const planProjections = await Promise.all(
      activePlans.map((plan) => calculateProjections(plan._id.toString()))
    );

    // Calculate overall projections
    const totalCurrentBalance = save2740Stats.totalSaved;
    const totalTarget = save2740Stats.totalTarget || YEARLY_TARGET;
    const remainingAmount = Math.max(0, totalTarget - totalCurrentBalance);
    const progressPercentage = totalTarget > 0 ? (totalCurrentBalance / totalTarget) * 100 : 0;

    // Weekly and monthly projections
    const weeklyProjection = DAILY_CHALLENGE_AMOUNT * 7;
    const monthlyProjection = DAILY_CHALLENGE_AMOUNT * 30;
    const yearlyProjection = YEARLY_TARGET;

    // Calculate days to completion at $27.40/day
    const daysToCompletion = remainingAmount > 0 ? Math.ceil(remainingAmount / DAILY_CHALLENGE_AMOUNT) : 0;
    const projectedCompletionDate = daysToCompletion > 0
      ? new Date(Date.now() + daysToCompletion * 24 * 60 * 60 * 1000)
      : null;

    // Check if on track
    const daysSinceStart = activePlans.length > 0
      ? Math.floor((Date.now() - new Date(activePlans[0].startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const expectedBalance = daysSinceStart * DAILY_CHALLENGE_AMOUNT;
    const onTrack = totalCurrentBalance >= expectedBalance * 0.9;

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            currentBalance: totalCurrentBalance,
            targetAmount: totalTarget,
            remainingAmount,
            progressPercentage: Math.min(100, progressPercentage),
            onTrack,
          },
          projections: {
            daily: DAILY_CHALLENGE_AMOUNT,
            weekly: weeklyProjection,
            monthly: monthlyProjection,
            yearly: yearlyProjection,
            daysToCompletion,
            projectedCompletionDate,
          },
          stats: {
            ...save2740Stats,
            walletBalance,
            totalPlans: activePlans.length,
          },
          plans: planProjections.map((proj, idx) => ({
            planId: activePlans[idx]._id.toString(),
            name: activePlans[idx].name,
            ...proj,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching projections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projections' },
      { status: 500 }
    );
  }
}
