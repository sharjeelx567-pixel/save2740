import express, { Request, Response } from 'express';
import { User } from '../../models/auth.model';
import { Admin } from '../../modules/admin/auth/admin.model';
import { generateAccessToken } from '../../utils/token-utils';
import { connectDB } from '../../config/db';
import { authenticateAdmin, authenticateToken, AuthRequest } from '../../middleware/auth';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        await connectDB();
        const { email, password, mfaToken } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // Find Admin
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if MFA is enabled
        if (admin.mfaEnabled) {
            if (!mfaToken) {
                return res.json({
                    success: true,
                    data: { mfaRequired: true, email: admin.email }
                });
            }

            // Verify MFA Token
            const isValidTicket = authenticator.verify({
                token: mfaToken,
                secret: admin.mfaSecret!
            });

            if (!isValidTicket) {
                return res.status(401).json({ success: false, error: 'Invalid MFA code' });
            }
        }

        // Generate token
        const token = generateAccessToken({
            userId: admin._id.toString(),
            email: admin.email,
            role: admin.role
        });

        admin.lastLogin = new Date();
        await admin.save();

        return res.json({
            success: true,
            data: {
                accessToken: token,
                user: {
                    id: admin._id,
                    email: admin.email,
                    name: admin.username,
                    role: admin.role
                }
            }
        });

    } catch (error: any) {
        console.error('Admin login error:', error);
        return res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

// GET /api/admin/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // First try to find in Admin collection
        const admin = await Admin.findById(req.user?.userId || req.userId);

        if (admin) {
            return res.status(200).json({
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

        // Fallback to User collection for backward compatibility
        const user = await User.findById(req.user?.userId || req.userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Admin not found'
            });
        }

        // Check if user is admin
        const isAdmin = user.email.toLowerCase() === 'admin@save2740' ||
            user.role === 'admin' ||
            user.role === 'super_admin';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                name: user.firstName + ' ' + (user.lastName || ''),
                role: user.role || 'admin',
                firstName: user.firstName,
                lastName: user.lastName
            }
        });

    } catch (error: any) {
        console.error('Admin me error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET /api/admin/auth/mfa/setup - Generate MFA Secret
router.get('/mfa/setup', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const admin = await Admin.findById(req.userId);
        if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(admin.email, 'Save2740-Admin', secret);
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        res.json({
            success: true,
            data: {
                secret,
                qrCodeUrl
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to setup MFA' });
    }
});

// POST /api/admin/auth/mfa/enable - Enable MFA
router.post('/mfa/enable', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { secret, token } = req.body;
        const admin = await Admin.findById(req.userId);
        if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

        const isValid = authenticator.verify({ token, secret });
        if (!isValid) {
            return res.status(400).json({ success: false, error: 'Invalid MFA code' });
        }

        admin.mfaSecret = secret;
        admin.mfaEnabled = true;
        await admin.save();

        res.json({ success: true, message: 'MFA enabled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to enable MFA' });
    }
});

// PATCH /mfa/password - Change password
router.patch('/password', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
        }

        const admin = await Admin.findById(req.userId);
        if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Incorrect current password' });
        }

        admin.passwordHash = newPassword;
        await admin.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update password' });
    }
});

export default router;
