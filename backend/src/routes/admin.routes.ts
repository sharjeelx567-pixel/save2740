import express, { Response } from 'express';
import mongoose from 'mongoose';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { User } from '../models/auth.model';
import { Admin } from '../modules/admin/auth/admin.model';
import { KycDocument } from '../models/kyc-document';
import { connectDB } from '../config/db';
import { generateAccessToken } from '../utils/token-utils';
import { createRefreshToken } from '../utils/token-utils';
import bcrypt from 'bcryptjs';
import { addEmailJob, addNotificationJob } from '../utils/job-queue';

const router = express.Router();

// POST /api/admin/auth/login
router.post('/auth/login', async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password required'
            });
        }

        // Find admin in Admin collection
        let admin: any = await Admin.findOne({ email: email.toLowerCase() });
        let isAdminCollection = true;

        if (!admin) {
            // Fallback: Check User collection
            const { User } = require('../../models/auth.model');
            const user = await User.findOne({ email: email.toLowerCase() });

            if (user && (user.role === 'admin' || user.role === 'super_admin')) {
                admin = user;
                isAdminCollection = false;
            }
        }

        if (!admin) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if admin is active
        // Admin model uses 'isActive' (boolean), User model uses 'accountStatus' (string)
        const isActive = isAdminCollection ? admin.isActive : admin.accountStatus === 'active';

        if (!isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate tokens
        const accessToken = generateAccessToken({
            userId: admin._id.toString(),
            email: admin.email,
            role: admin.role
        });
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const refreshTokenData = await createRefreshToken(admin._id.toString(), ipAddress);

        // Set refresh cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshTokenData.token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: refreshTokenData.token,
                user: {
                    id: admin._id,
                    email: admin.email,
                    username: admin.username,
                    role: admin.role
                }
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// GET /api/admin/auth/me
router.get('/auth/me', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // Find admin in Admin collection
        const admin = await Admin.findById(req.user?.userId);

        if (admin) {
            return res.json({
                success: true,
                data: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.username,
                    role: admin.role,
                    username: admin.username
                }
            });
        }

        return res.status(404).json({
            success: false,
            error: 'Admin not found'
        });
    } catch (error) {
        console.error('Admin me error:', error);
        res.status(500).json({ success: false, error: 'Failed to get admin info' });
    }
});

// GET /api/admin/kyc/pending
router.get('/kyc/pending', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        console.log('[Admin] Fetching pending KYC via Users...');

        // Find users with pending status first - this is the source of truth for "User State"
        const pendingUsers = await User.find({
            kycStatus: 'pending'
        })
            .select('email firstName lastName kycStatus updatedAt')
            .sort({ updatedAt: -1 }) // Sort by recent update
            .limit(100);

        console.log(`[Admin] Found ${pendingUsers.length} users with pending KYC status.`);

        // Get KYC doc for each user
        const kycWithUsers = await Promise.all(
            pendingUsers.map(async (user) => {
                const kyc = await KycDocument.findOne({ userId: user._id.toString() }).sort({ createdAt: -1 });

                if (!kyc) {
                    console.log(`[Admin] WARN: KYC Document missing for user ${user._id} who is pending.`);
                }

                return {
                    id: kyc?._id || `missing-${user._id}`,
                    userId: user._id,
                    user: {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    },
                    documentType: kyc?.documentType || 'Unknown',
                    documentNumber: kyc?.documentNumber || 'N/A',
                    status: 'pending', // Force pending since we filtered by user status
                    submittedAt: kyc?.createdAt || user.updatedAt,
                    frontImageUrl: kyc?.frontImageUrl || null,
                    backImageUrl: kyc?.backImageUrl || null,
                    selfieImageUrl: kyc?.selfieImageUrl || null,
                    warning: !kyc ? 'Document record missing' : null
                };
            })
        );

        res.json({
            success: true,
            data: kycWithUsers
        });
    } catch (error) {
        console.error('Get pending KYC error:', error);
        res.status(500).json({ success: false, error: 'Failed to get pending KYC' });
    }
});

// GET /api/admin/kyc/:userId
router.get('/kyc/:userId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;

        const kycDoc = await KycDocument.findOne({ userId }).sort({ createdAt: -1 });
        const user = await User.findById(userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    kycStatus: user.kycStatus,
                    accountStatus: user.accountStatus
                },
                kyc: kycDoc ? {
                    id: kycDoc._id,
                    documentType: kycDoc.documentType,
                    documentNumber: kycDoc.documentNumber,
                    status: kycDoc.status,
                    frontImageUrl: kycDoc.frontImageUrl,
                    backImageUrl: kycDoc.backImageUrl,
                    selfieImageUrl: kycDoc.selfieImageUrl,
                    rejectionReason: kycDoc.rejectionReason,
                    submittedAt: kycDoc.createdAt,
                    reviewedAt: kycDoc.verifiedAt
                } : null
            }
        });
    } catch (error) {
        console.error('Get KYC error:', error);
        res.status(500).json({ success: false, error: 'Failed to get KYC' });
    }
});

// POST /api/admin/kyc/approve
router.post('/kyc/approve', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId, kycId, notes } = req.body;

        if (!userId || !kycId) {
            return res.status(400).json({
                success: false,
                error: 'userId and kycId are required'
            });
        }

        const kycDoc = await KycDocument.findById(kycId);
        if (!kycDoc || kycDoc.userId !== userId) {
            return res.status(404).json({
                success: false,
                error: 'KYC document not found'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const admin = await User.findById(req.userId);
        const previousStatus = kycDoc.status;

        // Update KYC document
        kycDoc.status = 'approved';
        kycDoc.verifiedBy = req.userId;
        kycDoc.verifiedAt = new Date();
        await kycDoc.save();

        // Update user
        user.kycStatus = 'approved';
        await user.save();

        // Send Notification
        await addNotificationJob({
            userId: user._id.toString(),
            title: 'KYC Approved',
            message: 'Your identity has been verified. You now have full access to all features.',
            type: 'kyc_approved'
        });

        // Send Email
        await addEmailJob({
            to: user.email,
            subject: 'KYC Verification Approved - Save2740',
            html: `
                <h2>Congratulations!</h2>
                <p>Your KYC verification is complete.</p>
                <p>You now have full access to all features including improved withdrawal limits and group creation.</p>
                <br>
                <p>Best regards,<br>Save2740 Team</p>
            `
        });

        // Create audit log
        const { KycAuditLog } = require('../models/kyc-audit-log.model');
        await KycAuditLog.create({
            kycDocumentId: kycId,
            userId,
            action: 'approved',
            previousStatus,
            newStatus: 'approved',
            performedBy: req.userId,
            notes,
            metadata: {
                adminEmail: admin?.email,
                userEmail: user.email,
                ipAddress: req.ip,
            }
        });

        res.json({
            success: true,
            message: 'KYC approved successfully',
            data: {
                kycId: kycDoc._id,
                userId: user._id,
                status: 'approved'
            }
        });
    } catch (error) {
        console.error('Approve KYC error:', error);
        res.status(500).json({ success: false, error: 'Failed to approve KYC' });
    }
});

// POST /api/admin/kyc/reject
router.post('/kyc/reject', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId, kycId, reason, notes } = req.body;

        if (!userId || !reason) {
            return res.status(400).json({
                success: false,
                error: 'userId and reason are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        let kycDoc = null;
        if (kycId && mongoose.isValidObjectId(kycId)) {
            kycDoc = await KycDocument.findById(kycId);
        }

        const admin = await User.findById(req.userId);
        const previousStatus = kycDoc ? kycDoc.status : user.kycStatus;

        // Update KYC document if exists
        if (kycDoc) {
            kycDoc.status = 'rejected';
            kycDoc.rejectionReason = reason;
            kycDoc.verifiedBy = req.userId;
            kycDoc.verifiedAt = new Date();
            await kycDoc.save();
        } else {
            console.log(`[Admin] WARN: Rejecting KYC for user ${userId} without valid KycDocument (${kycId}).`);
        }

        // Update user
        user.kycStatus = 'rejected';
        await user.save();

        // Send Notification
        await addNotificationJob({
            userId: user._id.toString(),
            title: 'KYC Verification Failed',
            message: `Your KYC application was rejected. Reason: ${reason}`,
            type: 'kyc_rejected'
        });

        // Send Email
        await addEmailJob({
            to: user.email,
            subject: 'KYC Verification Update - Save2740',
            html: `
                <h2>KYC Verification Update</h2>
                <p>We were unable to verify your identity.</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>Please log in to the app to view details and resubmit if allowed.</p>
                <br>
                <p>Best regards,<br>Save2740 Team</p>
            `
        });

        // Create audit log
        const { KycAuditLog } = require('../models/kyc-audit-log.model');
        await KycAuditLog.create({
            kycDocumentId: kycDoc?._id || new mongoose.Types.ObjectId(), // Placeholder
            userId,
            action: 'rejected',
            previousStatus,
            newStatus: 'rejected',
            performedBy: req.userId,
            reason,
            notes,
            metadata: {
                adminEmail: admin?.email,
                userEmail: user.email,
                ipAddress: req.ip,
                noDocumentFound: !kycDoc
            }
        });

        res.json({
            success: true,
            message: 'KYC rejected successfully',
            data: {
                kycId: kycDoc?._id,
                userId: user._id,
                status: 'rejected',
                reason
            }
        });
    } catch (error) {
        console.error('Reject KYC error:', error);
        res.status(500).json({ success: false, error: 'Failed to reject KYC' });
    }
});

// GET /api/admin/users
router.get('/users', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { page = 1, limit = 50, search, status } = req.query;

        const query: any = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.accountStatus = status;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const users = await User.find(query)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: (user as any).role || 'user',
                    kycStatus: user.kycStatus,
                    accountStatus: user.accountStatus,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                })),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to get users' });
    }
});

// POST /api/admin/users/lock
router.post('/users/lock', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        user.accountStatus = 'locked';
        await user.save();

        res.json({
            success: true,
            message: 'User locked successfully',
            data: {
                userId: user._id,
                accountStatus: 'locked'
            }
        });
    } catch (error) {
        console.error('Lock user error:', error);
        res.status(500).json({ success: false, error: 'Failed to lock user' });
    }
});

// POST /api/admin/users/unlock
router.post('/users/unlock', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        user.accountStatus = 'active';
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'User unlocked successfully',
            data: {
                userId: user._id,
                accountStatus: 'active'
            }
        });
    } catch (error) {
        console.error('Unlock user error:', error);
        res.status(500).json({ success: false, error: 'Failed to unlock user' });
    }
});

// POST /api/admin/kyc/request-reupload
router.post('/kyc/request-reupload', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId, kycId, reason, notes } = req.body;

        if (!userId || !reason) {
            return res.status(400).json({
                success: false,
                error: 'userId and reason are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        let kycDoc = null;
        if (kycId && mongoose.isValidObjectId(kycId)) {
            kycDoc = await KycDocument.findById(kycId);
        }

        const admin = await User.findById(req.userId);
        const previousStatus = kycDoc ? kycDoc.status : user.kycStatus;

        // Update KYC document - mark as rejected with re-upload request
        if (kycDoc) {
            kycDoc.status = 'rejected';
            kycDoc.rejectionReason = `Re-upload requested: ${reason}`;
            kycDoc.verifiedBy = req.userId;
            kycDoc.verifiedAt = new Date();
            await kycDoc.save();
        } else {
            console.log(`[Admin] WARN: Requesting re-upload for user ${userId} without valid KycDocument (${kycId}).`);
        }

        // Update user - allow re-submission
        user.kycStatus = 'rejected';
        await user.save();

        // Send Notification
        await addNotificationJob({
            userId: user._id.toString(),
            title: 'Action Required: KYC Re-upload',
            message: `Please re-upload your documents. Reason: ${reason}`,
            type: 'kyc_reupload'
        });

        // Send Email
        await addEmailJob({
            to: user.email,
            subject: 'Action Required: Re-upload KYC Documents',
            html: `
                <h2>Action Required</h2>
                <p>We noticed an issue with your documents.</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>Please log in and re-upload your documents to proceed.</p>
                <br>
                <p>Best regards,<br>Save2740 Team</p>
            `
        });

        // Create audit log
        const { KycAuditLog } = require('../models/kyc-audit-log.model');
        await KycAuditLog.create({
            kycDocumentId: kycDoc?._id || new mongoose.Types.ObjectId(),
            userId,
            action: 'request_reupload',
            previousStatus,
            newStatus: 'rejected',
            performedBy: req.userId,
            reason,
            notes,
            metadata: {
                adminEmail: admin?.email,
                userEmail: user.email,
                ipAddress: req.ip,
                noDocumentFound: !kycDoc
            }
        });

        res.json({
            success: true,
            message: 'Re-upload requested successfully',
            data: {
                kycId: kycDoc?._id,
                userId: user._id,
                status: 'rejected',
                reason
            }
        });
    } catch (error) {
        console.error('Request re-upload error:', error);
        res.status(500).json({ success: false, error: 'Failed to request re-upload' });
    }
});

// GET /api/admin/kyc/audit-log/:kycId
router.get('/kyc/audit-log/:kycId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { kycId } = req.params;

        const { KycAuditLog } = require('../models/kyc-audit-log.model');
        const logs = await KycAuditLog.find({ kycDocumentId: kycId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({ success: false, error: 'Failed to get audit log' });
    }
});

export default router;
