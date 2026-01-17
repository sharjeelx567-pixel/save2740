import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ChatSession } from '@/lib/models/support-chat';
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

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Find and update the session
        const session = await ChatSession.findByIdAndUpdate(
            sessionId,
            {
                status: 'resolved',
                resolvedAt: new Date(),
            },
            { new: true }
        );

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { session },
        });
    } catch (error) {
        console.error('Error resolving chat session:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to resolve session' },
            { status: 500 }
        );
    }
}
