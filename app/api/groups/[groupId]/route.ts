import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Group } from '@/lib/models/group.model';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify JWT
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(
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

    // Fetch group from database
    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is a member or creator
    const isMember = group.members.some(
      (m: any) => m.userId.toString() === user.userId
    );
    const isCreator = group.creatorId.toString() === user.userId;

    if (!isMember && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to group' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    // Only creator can update settings
    if (group.creatorId.toString() !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Only creator can update group settings' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'purpose', 'frequency', 'rules', 'payoutOrderRule'];

    // Only allow updating rules/display fields if group is active
    // Critical fields like amount/maxMembers shouldn't change after creation/joining started ideally
    // But for MVP flexibility, we'll allow name/purpose updates always

    if (body.name) group.name = body.name;
    if (body.purpose) group.purpose = body.purpose;
    if (body.rules) group.rules = body.rules;
    if (body.payoutOrderRule) group.payoutOrderRule = body.payoutOrderRule;

    await group.save();

    return NextResponse.json({
      success: true,
      message: 'Group updated successfully',
      data: group,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    if (group.creatorId.toString() !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Only creator can delete group' },
        { status: 403 }
      );
    }

    await Group.findByIdAndDelete(groupId);

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
