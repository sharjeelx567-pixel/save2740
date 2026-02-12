
import { Request, Response } from 'express';
import crypto from 'crypto';
import { User, IUser } from '../models/auth.model';
import { generateAccessToken, createRefreshToken, revokeRefreshToken, revokeAllUserTokens, verifyRefreshToken } from '../utils/token-utils';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email-service';
import { notifyLoginAttempt, notifyPasswordChanged } from '../utils/notification-service';

// ... (existing code)



// --- Helpers ---
function generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';
import { Referral, ReferralCode } from '../models/referral.model';
import { detectFraudulentReferral, ReferralAttempt } from '../utils/referral-fraud-detection';

// 1. SIGN UP
export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, selectedChallenge, multiplier, referralCode, deviceFingerprint, phoneNumber } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }

        // Validate referral code if provided
        let referrerCode: any = null;
        let referrerId: string | null = null;
        if (referralCode) {
            referrerCode = await ReferralCode.findOne({ code: referralCode.toUpperCase() });
            if (!referrerCode) {
                return res.status(400).json({ success: false, error: 'Invalid referral code' });
            }
            referrerId = referrerCode.userId;
        }

        const verificationToken = generateRandomToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = new User({
            email,
            passwordHash: password, // Will be hashed by pre-save hook
            firstName,
            lastName,
            phoneNumber: phoneNumber || undefined,
            emailVerified: false,
            accountStatus: 'active',
            verificationToken,
            verificationTokenExpires: verificationExpires,
            referredBy: referrerId || undefined,
        });

        await user.save();

        // --- Save2740 Business Logic: Create Wallet ---
        let dailySavingAmount = 27.4;
        // Default challenge values
        if (selectedChallenge === 'weekly') {
            dailySavingAmount = 191.80 / 7;
        } else if (selectedChallenge === 'monthly') {
            dailySavingAmount = 849.40 / 30;
        }

        if (multiplier && !isNaN(multiplier)) {
            dailySavingAmount *= Number(multiplier);
        }

        await Wallet.create({
            userId: user._id.toString(),
            balance: 0,
            availableBalance: 0,
            locked: 0,
            lockedInPockets: 0,
            referralEarnings: 0,
            currentStreak: 0,
            dailySavingAmount: dailySavingAmount,
        });
        // ----------------------------------------------

        // Process referral with fraud detection
        if (referralCode && referrerId) {
            // Fraud detection
            const referralHistory = await Referral.find({}).lean();
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

            const attempt: ReferralAttempt = {
                referrerId: referrerId,
                refereeId: user._id.toString(),
                refereeEmail: email,
                refereePhone: phoneNumber || '',
                refereeIP: ipAddress,
                deviceFingerprint: deviceFingerprint || '',
                timestamp: new Date(),
            };

            const fraudCheck = detectFraudulentReferral(attempt, referralHistory as any[]);

            if (fraudCheck.action === 'reject') {
                // Delete the just-created user and wallet
                await User.deleteOne({ _id: user._id });
                await Wallet.deleteOne({ userId: user._id.toString() });

                return res.status(400).json({
                    success: false,
                    error: 'Referral validation failed',
                    reasons: fraudCheck.reasons,
                });
            }

            // Create referral record (pending until first contribution)
            await Referral.create({
                referrerId: referrerId,
                referredId: user._id.toString(),
                referralCode: referralCode.toUpperCase(),
                status: fraudCheck.action === 'flag' ? 'pending' : 'pending', // All start pending
                earnings: 0,
                bonusEarned: 0,
                bonusPaid: 0,
                signupDate: new Date(),
                metadata: {
                    signupSource: 'web',
                    fraudRiskScore: fraudCheck.riskScore,
                    fraudReasons: fraudCheck.reasons.join(', '),
                },
            });

            // Update referrer's code stats
            await ReferralCode.updateOne(
                { userId: referrerId },
                { $inc: { totalReferrals: 1 } }
            );

            console.log(`✅ Referral recorded: ${referralCode} -> ${email} (Risk: ${fraudCheck.riskScore})`);
        }

        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Account created. Please verify your email.',
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, error: 'Signup failed' });
    }
};

// 2. EMAIL VERIFICATION
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, error: 'Token required' });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() } // Check expiry
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });
        }

        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        // --- REFERRAL BONUS: $5 to referee ---
        if (user.referredBy) {
            try {
                const sandboxWallet = await Wallet.findOne({ userId: 'sandbox2' });
                if (sandboxWallet && sandboxWallet.balance >= 5) {
                    const refereeWallet = await Wallet.findOne({ userId: user._id.toString() });
                    if (refereeWallet) {
                        const bonus = 5;
                        sandboxWallet.balance -= bonus;
                        sandboxWallet.availableBalance -= bonus;
                        await sandboxWallet.save();
                        refereeWallet.balance += bonus;
                        refereeWallet.availableBalance += bonus;
                        await refereeWallet.save();
                        await Transaction.create({
                            userId: 'sandbox2',
                            type: 'debit',
                            amount: bonus,
                            category: 'referral_bonus',
                            status: 'completed',
                            description: `Welcome bonus for ${user.email}`
                        });
                        await Transaction.create({
                            userId: user._id.toString(),
                            type: 'credit',
                            amount: bonus,
                            category: 'referral_bonus',
                            status: 'completed',
                            description: '🎉 Welcome bonus! Thank you for joining Save2740'
                        });
                        console.log(`✅ $${bonus} bonus → ${user.email}`);
                    }
                }
            } catch (err) { console.error('Bonus error:', err); }
        }

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
};

// 2b. RESEND VERIFICATION EMAIL
export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Return success to prevent email enumeration
            return res.json({ success: true, message: 'If account exists, verification email sent.' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ success: false, error: 'Email already verified' });
        }

        // Generate new verification token
        const verificationToken = generateRandomToken();
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();

        await sendVerificationEmail(email, verificationToken);

        res.json({ success: true, message: 'Verification email sent.' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to send verification email' });
    }
};

// Development: Test OTP retrieval (for testing when email doesn't work)
export const getTestOTP = async (req: Request, res: Response) => {
    try {
        // Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, error: 'Not available in production' });
        }

        const { email } = req.query;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.resetPasswordToken) {
            return res.status(404).json({ success: false, error: 'No active OTP found for this email' });
        }

        // Check if OTP is expired
        if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ success: false, error: 'OTP has expired' });
        }

        res.json({
            success: true,
            data: {
                otp: user.resetPasswordToken,
                expiresAt: user.resetPasswordExpires
            }
        });
    } catch (error) {
        console.error('Get test OTP error:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve OTP' });
    }
};

// 3. LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check Lock
        if (user.lockUntil && user.lockUntil > new Date()) {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_LOCKED',
                error: 'Account is temporarily locked due to failed login attempts. Try again later.'
            });
        }

        // Check Status
        if (user.accountStatus === 'suspended') {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_SUSPENDED', // Explicit code
                error: 'Account is suspended. Contact support.'
            });
        }

        // Check Status Locked (manual)
        if (user.accountStatus === 'locked') {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_LOCKED',
                error: 'Account is locked.'
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            // Handle Locking Logic
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
                // Optionally update status, but lockUntil is sufficient for temp lock
            }

            await user.save();

            // Send critical notification for failed login
            await notifyLoginAttempt(user._id.toString(), req.ip || 'unknown', 'unknown', false);

            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check Email Verification (AFTER password check to prevent enumeration, or BEFORE? Requirement says "Check in this order: User exists -> Email verified...". Usually verify email check comes after auth to prevent leaking "email exists" info, but prompted order is user->verified. I'll check verified now.)

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                code: 'EMAIL_NOT_VERIFIED', // Explicit code
                error: 'Please verify your email address'
            });
        }

        // Success: Reset failures
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();
        await user.save();

        // Generate Tokens
        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
            role: (user as any).role || 'user'
        });
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const refreshTokenData = await createRefreshToken(user._id.toString(), ipAddress);

        // Set Refresh Cookie
        // CRITICAL: Use 'none' for cross-origin (Vercel frontend -> backend) or 'lax' for same-origin
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshTokenData.token, {
            httpOnly: true,
            secure: isProduction, // Must be true when sameSite is 'none'
            sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin credentials
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: refreshTokenData.token,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

// 4. LOGOUT
export const logout = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await revokeRefreshToken(refreshToken, req.ip || 'unknown');
        }

        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax', // Must match the original setting
            path: '/',
        });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Logout failed' });
    }
};

// Helper to generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 5. FORGOT PASSWORD (now sends OTP instead of token)
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (user) {
            const otp = generateOTP();
            user.resetPasswordToken = otp; // Store OTP (6 digits)
            user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            await user.save();

            // Send OTP email
            await sendPasswordResetEmail(email, otp);

            // Log OTP for development (remove in production)
            console.log(`🔑 [PASSWORD RESET OTP] Email: ${email}, OTP: ${otp}`);
        }

        res.json({ success: true, message: 'If account exists, OTP sent to email.' });
    } catch (error) {
        res.status(500).json({ error: 'Request failed' });
    }
};

// 6. RESET PASSWORD (accepts OTP, not token)
export const resetPassword = async (req: Request, res: Response) => {
    try {
        // Accept both 'otp' and 'token' for compatibility
        const { otp, token, newPassword, email } = req.body;
        const resetCode = otp || token;

        if (!resetCode || !newPassword) {
            return res.status(400).json({ error: 'OTP and newPassword required' });
        }

        // Build query - prefer email + OTP match for better security
        const query: any = {
            resetPasswordToken: resetCode,
            resetPasswordExpires: { $gt: new Date() }
        };

        if (email) {
            query.email = email.toLowerCase();
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        user.passwordHash = newPassword; // Will be hashed by pre-save
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Invalidate all existing sessions
        await revokeAllUserTokens(user._id.toString());

        // Send critical notification for password change
        await notifyPasswordChanged(user._id.toString(), req.ip || 'unknown');

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Reset failed' });
    }
};

// 7. REFRESH TOKEN
// 7. REFRESH TOKEN
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'Refresh token required' });
        }

        const { valid, userId, message } = await verifyRefreshToken(token);

        if (!valid || !userId) {
            // Clear the invalid cookie
            res.clearCookie('refreshToken', { path: '/' });
            return res.status(403).json({ success: false, code: 'SESSION_EXPIRED', error: message || 'Invalid refresh token' });
        }

        const user = await User.findById(userId);
        if (!user || user.accountStatus !== 'active') {
            // Clear the cookie for inactive user
            res.clearCookie('refreshToken', { path: '/' });
            return res.status(403).json({ success: false, code: 'ACCOUNT_SUSPENDED', error: 'User inactive' });
        }

        // Rotate Tokens
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        await revokeRefreshToken(token, ipAddress, 'rotated'); // Revoke old

        const newRefreshTokenData = await createRefreshToken(user._id.toString(), ipAddress);
        const newAccessToken = generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
            role: (user as any).role || 'user'
        });

        // Set new cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', newRefreshTokenData.token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshTokenData.token
            }
        });

    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ success: false, error: 'Refresh failed' });
    }
};

// 8. GET CURRENT USER
export const getMe = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                code: 'AUTH_REQUIRED',
                error: 'Authentication required'
            });
        }

        const { verifyAccessToken } = await import('../utils/token-utils');
        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                code: 'SESSION_EXPIRED',
                error: 'Invalid or expired token'
            });
        }

        const user = await User.findById(decoded.userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check account status
        if (user.accountStatus === 'suspended') {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_SUSPENDED',
                error: 'Account is suspended. Contact support.'
            });
        }

        if (user.accountStatus === 'locked' || (user.lockUntil && user.lockUntil > new Date())) {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_LOCKED',
                error: 'Account is locked.'
            });
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: (user as any).role || 'user',
                emailVerified: user.emailVerified,
                kycStatus: user.kycStatus,
                accountStatus: user.accountStatus,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, error: 'Failed to get user info' });
    }
};
