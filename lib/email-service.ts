import nodemailer from "nodemailer"

// Initialize transporter with Gmail configuration
const getTransporter = () => {
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  
  // Detect Gmail: if EMAIL_SERVICE is gmail, or SMTP_HOST contains gmail, or no SMTP_HOST set
  const isGmail = 
    process.env.EMAIL_SERVICE === 'gmail' || 
    smtpHost?.toLowerCase().includes('gmail') ||
    emailUser?.toLowerCase().endsWith('@gmail.com') ||
    !smtpHost;

  // If using Gmail, use Gmail service (recommended for Gmail)
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  // Custom SMTP configuration for other providers
  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const transporter = getTransporter();

/**
 * Get the correct "from" email address
 * For Gmail accounts, must use the authenticated email (SMTP_USER)
 */
function getFromEmail(): string {
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpFrom = process.env.SMTP_FROM;
  const isGmailAccount = emailUser?.toLowerCase().endsWith('@gmail.com');
  
  // If using Gmail and SMTP_FROM is not a Gmail address, use the Gmail account
  if (isGmailAccount && smtpFrom && !smtpFrom.toLowerCase().endsWith('@gmail.com')) {
    return emailUser!;
  }
  
  // Otherwise use SMTP_FROM if set, or fall back to emailUser
  return smtpFrom || emailUser || "noreply@save2740.com";
}

/**
 * Send verification code via email
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn("[EMAIL] SMTP credentials not configured. Skipping email send.")
      return false
    }

    const mailOptions = {
      from: getFromEmail(),
      to: email,
      subject: "Save2740 - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Email Verification</h2>
          <p style="color: #4b5563;">Thank you for signing up with Save2740!</p>
          <p style="color: #4b5563;">Your verification code is:</p>
          <h1 style="color: #10b981; letter-spacing: 5px; font-size: 36px; font-weight: bold;">${code}</h1>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 24 hours.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you didn't sign up for Save2740, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Save2740 Team | © 2026 All rights reserved
          </p>
        </div>
      `,
      text: `Your Save2740 verification code is: ${code}\n\nThis code will expire in 24 hours.`,
    }

    const result = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(`[EMAIL] Failed to send verification email to ${email}:`, error)
    return false
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn("[EMAIL] SMTP credentials not configured. Skipping email send.")
      return false
    }

    const mailOptions = {
      from: getFromEmail(),
      to: email,
      subject: "Welcome to Save2740!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Welcome to Save2740, ${firstName}!</h2>
          <p style="color: #4b5563;">Your email has been successfully verified.</p>
          <p style="color: #4b5563;">You can now access all features of Save2740:</p>
          <ul style="line-height: 1.8; color: #4b5563;">
            <li>Create and manage savings goals</li>
            <li>Track your progress</li>
            <li>Get personalized insights</li>
            <li>Join our community</li>
          </ul>
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Get Started
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Save2740 Team | © 2026 All rights reserved
          </p>
        </div>
      `,
      text: `Welcome to Save2740, ${firstName}! Your email has been verified successfully. Start saving today!`,
    }

    const result = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(`[EMAIL] Failed to send welcome email to ${email}:`, error)
    return false
  }
}

/**
 * Send password reset code via email
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string
): Promise<boolean> {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn("[EMAIL] SMTP credentials not configured. Skipping email send.")
      return false
    }

    const mailOptions = {
      from: getFromEmail(),
      to: email,
      subject: "Save2740 - Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Password Reset Request</h2>
          <p style="color: #4b5563;">We received a request to reset your password.</p>
          <p style="color: #4b5563;">Your password reset code is:</p>
          <h1 style="color: #10b981; letter-spacing: 5px; font-size: 36px; font-weight: bold;">${code}</h1>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 24 hours.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          <p style="color: #ef4444; font-weight: bold; font-size: 14px; margin-top: 20px;">⚠️ Never share this code with anyone!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Save2740 Team | © 2026 All rights reserved
          </p>
        </div>
      `,
      text: `Your Save2740 password reset code is: ${code}\n\nThis code will expire in 24 hours.\n\nIf you didn't request a password reset, please ignore this email.`,
    }

    const result = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(`[EMAIL] Failed to send password reset email to ${email}:`, error)
    return false
  }
}

/**
 * Send password reset OTP via email (same as above but different naming)
 */
export async function sendPasswordResetOTP(
  email: string,
  otp: string
): Promise<boolean> {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn("[EMAIL] SMTP credentials not configured. Skipping email send.")
      return false
    }

    const mailOptions = {
      from: getFromEmail(),
      to: email,
      subject: "Save2740 - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Password Reset Request</h2>
          <p style="color: #4b5563;">We received a request to reset your password.</p>
          <p style="color: #4b5563;">Your one-time password (OTP) is:</p>
          <h1 style="color: #064E3B; letter-spacing: 5px; font-size: 36px; font-weight: bold; text-align: center;">${otp}</h1>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">This OTP will expire in 15 minutes.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          <p style="color: #ef4444; font-weight: bold; font-size: 14px; margin-top: 20px;">⚠️ Never share this OTP with anyone!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Save2740 Team | © 2026 All rights reserved
          </p>
        </div>
      `,
      text: `Your Save2740 password reset OTP is: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't request a password reset, please ignore this email.`,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`[EMAIL] Password reset OTP sent successfully to ${email}`)
    return true
  } catch (error: any) {
    // Don't fail the request if email sending fails - OTP is still generated
    console.error(`[EMAIL] Failed to send password reset OTP to ${email}:`, error.message || error)
    
    // Log helpful error message for Gmail
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error(`[EMAIL] Gmail authentication failed. Please check:`)
      console.error(`  1. Use App Password (not regular password) if 2FA is enabled`)
      console.error(`  2. Enable "Less secure app access" (deprecated) or use App Password`)
      console.error(`  3. Verify SMTP_USER and SMTP_PASSWORD in .env.local`)
      console.error(`  4. Generate App Password: https://myaccount.google.com/apppasswords`)
    }
    
    // Return true so the API doesn't fail - OTP is still generated and stored
    return false
  }
}

/**
 * Generic email send function
 */
async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<boolean> {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn("[EMAIL] SMTP credentials not configured. Skipping email send.")
      return false
    }

    const result = await transporter.sendMail({
      from: (process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@save2740.com"),
      ...options,
    })
    return true
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${options.to}:`, error)
    return false
  }
}
