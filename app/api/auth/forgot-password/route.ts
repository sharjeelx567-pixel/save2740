import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/auth.model'
import { PasswordResetToken } from '@/lib/models/password-reset.model'
import { sendPasswordResetOTP } from '@/lib/email-service'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/forgot-password
 * Generate a password reset OTP and send email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    // For security, always return success (don't reveal if email exists)
    if (!user) {
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, an OTP has been sent.' },
        { status: 200 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Delete any existing reset tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id.toString() })

    // Create new reset token with OTP
    await PasswordResetToken.create({
      userId: user._id.toString(),
      email: email.toLowerCase(),
      code: otp,
      codeHash: otpHash,
      expiresAt,
    })

    // Send OTP via email
    const emailSent = await sendPasswordResetOTP(email, otp)
    
    // Always log OTP to console for development/testing
    // This helps when email is not configured or fails
    console.log('\n' + '='.repeat(50))
    console.log('🔐 PASSWORD RESET OTP')
    console.log('='.repeat(50))
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 OTP: ${otp}`)
    console.log(`⏰ Expires: ${expiresAt.toLocaleString()}`)
    console.log(`📱 Status: ${emailSent ? '✅ Email sent' : '❌ Email failed - use OTP above'}`)
    console.log('='.repeat(50) + '\n')

    return NextResponse.json(
      { success: true, message: 'OTP sent to your email' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
