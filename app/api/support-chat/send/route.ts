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

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string; name?: string };
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { sessionId, message, sender = 'user' } = body;

        if (!message || message.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            );
        }

        let session;

        // If sessionId provided, find existing session
        if (sessionId) {
            session = await ChatSession.findById(sessionId);
            if (!session) {
                return NextResponse.json(
                    { success: false, error: 'Session not found' },
                    { status: 404 }
                );
            }
        } else {
            // Create new session or find existing active session for user
            session = await ChatSession.findOne({
                userId: user.userId,
                status: 'active',
            });

            if (!session) {
                session = await ChatSession.create({
                    userId: user.userId,
                    userEmail: user.email,
                    userName: user.name,
                    status: 'active',
                    lastMessageAt: new Date(),
                });
            }
        }

        // Create the message
        const chatMessage = await ChatMessage.create({
            sessionId: session._id,
            sender,
            message: message.trim(),
            read: false,
        });

        // Update session's lastMessageAt
        session.lastMessageAt = new Date();
        await session.save();

        return NextResponse.json({
            success: true,
            data: {
                message: chatMessage,
                sessionId: session._id,
            },
        });
    } catch (error) {
        console.error('Error sending chat message:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
