import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ChatSession, ChatMessage } from '@/lib/models/support-chat';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify JWT and get userId
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

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        // Get user from token
        const user = await getUserFromToken(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get sessionId from query params
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            // If no sessionId, find or create active session for user
            let session = await ChatSession.findOne({
                userId: user.userId,
                status: 'active',
            });

            // If no active session exists, return empty messages
            if (!session) {
                return NextResponse.json({
                    success: true,
                    data: {
                        messages: [],
                        session: null,
                    },
                });
            }

            // Get messages for the session
            const messages = await ChatMessage.find({
                sessionId: session._id,
            }).sort({ createdAt: 1 });

            return NextResponse.json({
                success: true,
                data: {
                    messages,
                    session,
                },
            });
        }

        // Find session by ID
        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        // Verify user owns this session (or is admin)
        if (session.userId.toString() !== user.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get messages for the session
        const messages = await ChatMessage.find({
            sessionId: session._id,
        }).sort({ createdAt: 1 });

        return NextResponse.json({
            success: true,
            data: {
                messages,
                session,
            },
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// Mark messages as read
export async function PATCH(request: NextRequest) {
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
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Verify session exists and user owns it
        const session = await ChatSession.findById(sessionId);
        if (!session || session.userId.toString() !== user.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Mark all admin messages as read
        await ChatMessage.updateMany(
            {
                sessionId,
                sender: 'admin',
                read: false,
            },
            {
                read: true,
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Messages marked as read',
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to mark messages as read' },
            { status: 500 }
        );
    }
}
