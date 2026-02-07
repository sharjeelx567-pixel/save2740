import nodemailer from 'nodemailer';

/**
 * Real Email Service using Nodemailer
 */

// Create transporter lazily to ensure env vars are loaded
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // Use App Password for Gmail
      },
    });
    console.log('📧 Email transporter initialized with:', process.env.SMTP_USER);
  }
  return _transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️ SMTP not configured. Falling back to mock email.');
    console.log(`
      📧 [MOCK EMAIL SENT]
      To: ${to}
      Subject: ${subject}
      Body:
      ${text}
      -----------------------
    `);
    return Promise.resolve();
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Save2740'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html: html || text.replace(/\n/g, '<br>'), // html body
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email to', to, ':', error);
    // Rethrow so the caller knows it failed
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Save2740</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Save2740</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your Daily Savings Journey</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        <p style="color: #666; line-height: 1.6;">Welcome to Save2740! Please verify your email address to get started on your savings journey.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify My Email</a>
        </div>
        <p style="color: #999; font-size: 14px;">Or copy this link into your browser:</p>
        <p style="color: #10b981; word-break: break-all; font-size: 14px;">${verificationLink}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">This link expires in 24 hours. If you didn't create a Save2740 account, please ignore this email.</p>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">© ${new Date().getFullYear()} Save2740. All rights reserved.</p>
    </body>
    </html>
  `;

  await sendEmail(
    email,
    'Verify Your Email - Save2740',
    `Welcome to Save2740! Please verify your email by clicking this link: ${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you didn't create a Save2740 account, please ignore this email.`,
    html
  );
}

export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Save2740</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Save2740</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Password Reset Request</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Your Password Reset Code</h2>
        <p style="color: #666; line-height: 1.6;">You requested to reset your password. Use the code below to complete the process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #f0fdf4; border: 2px dashed #10b981; padding: 20px 40px; border-radius: 10px;">
            <span style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px;">${otp}</span>
          </div>
        </div>
        <p style="color: #666; text-align: center; font-size: 14px;">⏰ This code expires in <strong>15 minutes</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">© ${new Date().getFullYear()} Save2740. All rights reserved.</p>
    </body>
    </html>
  `;

  await sendEmail(
    email,
    'Password Reset Code - Save2740',
    `Your Save2740 password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
    html
  );
}
