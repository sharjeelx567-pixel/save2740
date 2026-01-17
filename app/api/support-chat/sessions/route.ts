import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ChatSession, ChatMessage } from '@/lib/models/support-chat';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify JWT - for admin use, we'll just verify token exists
// In production, you'd want to check for admin role
async function getUserFromToken(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        // Verify user is authenticated (in production, check for admin role)
        const user = await getUserFromToken(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get status filter from query params
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') || 'active';

        let filter: any = {};
        if (status === 'active' || status === 'resolved') {
            filter.status = status;
        }
        // If status is 'all', don't add filter

        // Get all sessions with filter
        const sessions = await ChatSession.find(filter)
            .sort({ lastMessageAt: -1 })
            .limit(100);

        // For each session, get unread message count and last message
        const sessionsWithDetails = await Promise.all(
            sessions.map(async (session) => {
                const unreadCount = await ChatMessage.countDocuments({
                    sessionId: session._id,
                    sender: 'user',
                    read: false,
                });

                const lastMessage = await ChatMessage.findOne({
                    sessionId: session._id,
                }).sort({ createdAt: -1 });

                return {
                    ...session.toObject(),
                    unreadCount,
                    lastMessage: lastMessage ? lastMessage.message : '',
                    lastMessageTime: lastMessage ? lastMessage.createdAt : session.lastMessageAt,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: {
                sessions: sessionsWithDetails,
            },
        });
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}
