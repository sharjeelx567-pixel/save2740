import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_EXPIRY = "15m";
const JWT_REFRESH_EXPIRY = "7d";

// =========== TOKEN GENERATION ===========

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; iat: number; exp: number };
  } catch (error) {
    throw new Error("Invalid access token");
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; iat: number; exp: number };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

// =========== CODE/TOKEN GENERATION ===========

export const generateEmailVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// =========== HASHING ===========

export const hashCode = (code: string) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

export const verifyCode = (code: string, hash: string) => {
  return hashCode(code) === hash;
};

// =========== EMAIL SENDING ===========

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (options: EmailOptions) => {
  // If no email credentials configured, log and return success to allow signup to continue
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(`Email sending skipped (no credentials): ${options.to}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@save2740.com",
      ...options,
    });
    console.log(`Email sent successfully to: ${options.to}`);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't fail the signup process if email sending fails
    return true;
  }
};

export const sendEmailVerification = async (email: string, code: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Verify Your Email</h2>
      <p>Thank you for signing up with Save2740! Please verify your email address using the code below:</p>
      <div style="background-color: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h1 style="color: #059669; letter-spacing: 5px; margin: 0;">${code}</h1>
      </div>
      <p>This code will expire in 24 hours.</p>
      <p>If you didn't sign up for Save2740, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">© 2026 Save2740. All rights reserved.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your Save2740 Account",
    html,
  });
};

export const sendOTPEmail = async (email: string, otp: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Your One-Time Password</h2>
      <p>Your OTP for phone verification is:</p>
      <div style="background-color: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h1 style="color: #059669; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">© 2026 Save2740. All rights reserved.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Your Save2740 OTP Code",
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>Or copy this link: <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p style="color: #ef4444; font-weight: bold;">If you didn't request this, please ignore this email. Your password will not be changed.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">© 2026 Save2740. All rights reserved.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your Save2740 Password",
    html,
  });
};

// =========== VALIDATION ===========

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phoneNumber);
};

// =========== SECURITY ===========

export const getClientIP = (req: any): string => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

export const maskPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  const last4 = cleaned.slice(-4);
  return `***-***-${last4}`;
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split("@");
  const masked = localPart.slice(0, 2) + "*".repeat(localPart.length - 2);
  return `${masked}@${domain}`;
};

// =========== RATE LIMITING ===========

const attemptTracker = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean => {
  const now = Date.now();
  const attempt = attemptTracker.get(identifier);

  if (!attempt) {
    attemptTracker.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > attempt.resetTime) {
    attemptTracker.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (attempt.count >= maxAttempts) {
    return false;
  }

  attempt.count++;
  return true;
};

export const resetRateLimit = (identifier: string) => {
  attemptTracker.delete(identifier);
};
