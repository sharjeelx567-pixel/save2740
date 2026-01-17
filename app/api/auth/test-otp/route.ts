/**
 * Test OTP Retrieval API (Development Only)
 * GET /api/auth/test-otp?email=user@example.com
 * 
 * WARNING: This endpoint should be disabled in production!
 * Only use for development/testing when email is not configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PasswordResetToken } from '@/lib/models/password-reset.model';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the most recent password reset token for this email
    const resetToken = await PasswordResetToken.findOne({
      email: email.toLowerCase(),
    }).sort({ createdAt: -1 });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'No OTP found for this email. Please request a new one.' },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date() > resetToken.expiresAt;
    const expiresIn = Math.max(0, Math.floor((resetToken.expiresAt.getTime() - Date.now()) / 1000 / 60));

    return NextResponse.json(
      {
        success: true,
        data: {
          email: resetToken.email,
          otp: resetToken.code, // Show OTP in development
          expiresAt: resetToken.expiresAt,
          isExpired,
          expiresInMinutes: expiresIn,
          attempts: resetToken.attempts,
        },
        warning: 'This endpoint is for development only. OTPs should be sent via email in production.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test OTP retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve OTP' },
      { status: 500 }
    );
  }
}
