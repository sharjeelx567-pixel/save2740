import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Group } from '@/lib/models/group.model';
import { isGroupReadyForContributions } from '@/lib/utils/group-utils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify JWT
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    await connectToDatabase();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId } = params;
    const body = await request.json();
    const { amount, note } = body;

    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(
      (m: any) => m.userId.toString() === user.userId
    );

    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // BLOCKING LOGIC: Check if group is filled/ready
    if (!isGroupReadyForContributions(group)) {
      return NextResponse.json(
        {
          success: false,
          error: `Group is not yet filled. Contributions will start when all ${group.maxMembers} members have joined.`,
          data: {
            currentMembers: group.currentMembers,
            maxMembers: group.maxMembers,
            membersNeeded: group.maxMembers - group.currentMembers
          }
        },
        { status: 400 }
      );
    }

    // Process contribution
    // In a real app complexity, we would create a Transaction record here

    // Update member contribution
    group.members[memberIndex].totalContributed += parseFloat(amount);

    // Update group totals
    group.totalBalance += parseFloat(amount);
    group.totalContributed += parseFloat(amount);

    // Set status to active if it was just filled
    if (group.status === 'filled') {
      group.status = 'active';
    }

    await group.save();

    return NextResponse.json({
      success: true,
      message: 'Contribution successful',
      data: {
        totalContributed: group.members[memberIndex].totalContributed,
        groupBalance: group.totalBalance
      }
    });

  } catch (error) {
    console.error('Error processing contribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process contribution' },
      { status: 500 }
    );
  }
}
