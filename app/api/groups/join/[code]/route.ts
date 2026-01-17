import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Group } from '@/lib/models/group.model';
import { Wallet } from '@/lib/models/wallet.model';
import { calculatePayoutPosition } from '@/lib/utils/group-utils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify JWT
async function getUserFromToken(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) return null;
        return jwt.verify(token, JWT_SECRET) as { userId: string; email?: string; name?: string };
    } catch (error) {
        return null;
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { code: string } }
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

        // Join code from URL params
        const joinCode = params.code.toUpperCase();

        // Find group by join code
        const group = await Group.findOne({ joinCode });

        if (!group) {
            return NextResponse.json(
                { success: false, error: 'Invalid join code' },
                { status: 404 }
            );
        }

        // Check if group is open
        if (group.status !== 'open') {
            return NextResponse.json(
                { success: false, error: 'Group is full or closed' },
                { status: 400 }
            );
        }

        // Check if user is already a member
        const isMember = group.members.some(
            (member: any) => member.userId.toString() === user.userId
        );

        if (isMember) {
            return NextResponse.json(
                { success: false, error: 'You are already a member of this group' },
                { status: 400 }
            );
        }

        // Check if group is full (double check race condition logic in production with transactions)
        if (group.currentMembers >= group.maxMembers) {
            return NextResponse.json(
                { success: false, error: 'Group is full' },
                { status: 400 }
            );
        }

        // Calculate payout position
        // If random rule, we'll re-shuffle when filled, but for now assign next available
        const payoutPosition = calculatePayoutPosition(group.currentMembers, group.payoutOrderRule);

        // Add member
        group.members.push({
            userId: user.userId,
            name: user.name || 'Member',
            email: user.email || '',
            joinedAt: new Date(),
            totalContributed: 0,
            payoutPosition
        });

        group.currentMembers += 1;

        // Check if group is now filled
        if (group.currentMembers >= group.maxMembers) {
            group.status = 'filled';
            group.filledDate = new Date();

            // If random payout rule, shuffle positions now
            if (group.payoutOrderRule === 'random') {
                // Implement shuffling logic if needed, updating member.payoutPosition
                // For simplicity MVP, we'll keep as is or simple shuffle
                for (let i = group.members.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [group.members[i], group.members[j]] = [group.members[j], group.members[i]];
                }
                // Re-assign positions 1 to N
                group.members.forEach((m: any, idx: number) => {
                    m.payoutPosition = idx + 1;
                });
            }
        }

        await group.save();

        return NextResponse.json({
            success: true,
            message: 'Successfully joined group',
            data: {
                group,
                member: group.members.find((m: any) => m.userId.toString() === user.userId)
            }
        });

    } catch (error) {
        console.error('Error joining group:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to join group' },
            { status: 500 }
        );
    }
}
