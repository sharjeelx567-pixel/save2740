import express, { Request, Response } from 'express';
import { User } from '../../models/auth.model';
import { Admin } from '../../modules/admin/auth/admin.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../../utils/token-utils';
import { connectDB } from '../../config/db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        await connectDB();

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if user is admin
        const isAdmin = email.toLowerCase() === 'admin@save2740' || 
                       user.role === 'admin' || 
                       user.role === 'super_admin';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role || 'admin'
        });

        return res.status(200).json({
            success: true,
            data: {
                accessToken: token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.firstName + ' ' + (user.lastName || ''),
                    role: user.role || 'admin'
                }
            }
        });

    } catch (error: any) {
        console.error('Admin login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

// GET /api/admin/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        // First try to find in Admin collection
        const admin = await Admin.findById(req.user?.userId);

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
        const user = await User.findById(req.user?.userId).select('-password');

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

export default router;
