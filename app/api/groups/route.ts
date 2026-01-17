import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Group } from '@/lib/models/group.model';
import { generateJoinCode, generateReferralLink } from '@/lib/utils/group-utils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify JWT and get user info
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email?: string;
      name?: string;
      role?: string
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      groupName,
      purpose,
      contributionAmount,
      frequency,
      currency = 'USD',
      maxMembers = 10,
      payoutOrderRule = 'as-joined',
      rules = ''
    } = body;

    // Validate required fields
    if (!groupName || !purpose || !contributionAmount || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid frequency' },
        { status: 400 }
      );
    }

    // Validate contribution amount
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid contribution amount' },
        { status: 400 }
      );
    }

    const joinCode = generateJoinCode();
    const referralLink = generateReferralLink(joinCode);

    // Create new group
    const newGroup = await Group.create({
      name: groupName,
      purpose,
      currency,
      contributionAmount: amount,
      frequency,
      maxMembers: Math.max(2, parseInt(maxMembers.toString())),
      payoutOrderRule,
      rules,
      status: 'open',
      joinCode,
      referralLink,
      creatorId: user.userId,
      creatorEmail: user.email || '',
      startDate: new Date(),
      currentMembers: 1,
      members: [{
        userId: user.userId,
        name: user.name || 'Creator',
        email: user.email || '',
        joinedAt: new Date(),
        totalContributed: 0,
        payoutPosition: 1 // Creator is always #1 initially
      }]
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Group created successfully',
        data: newGroup,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find groups where user is creator OR member
    const groups = await Group.find({
      $or: [
        { creatorId: user.userId },
        { 'members.userId': user.userId }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: groups,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}
