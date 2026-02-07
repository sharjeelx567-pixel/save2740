import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    userId?: string;
    user?: any;
}

/**
 * Middleware to verify JWT token and authenticate requests
 */
export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from Authorization header (Bearer token)
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

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string; role?: string };

        // First check Admin collection (for admin panel requests)
        const { Admin } = await import('../modules/admin/auth/admin.model');
        const admin = await Admin.findById(decoded.userId);

        if (admin) {
            // Found in Admin collection
            if (!admin.isActive) {
                return res.status(403).json({
                    success: false,
                    code: 'ACCOUNT_DEACTIVATED',
                    error: 'Admin account is deactivated'
                });
            }

            req.userId = decoded.userId;
            req.user = { userId: decoded.userId, email: admin.email, role: admin.role };
            return next();
        }

        // Fallback: Check User collection
        const { User } = await import('../models/auth.model');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                code: 'AUTH_REQUIRED',
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

        // Attach user ID to request
        req.userId = decoded.userId;
        req.user = { ...decoded, role: (user as any).role || 'user' };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                code: 'SESSION_EXPIRED',
                message: 'Session expired. Please login again.'
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                code: 'AUTH_REQUIRED',
                error: 'Invalid access token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication - attaches user if token is present but doesn't fail if missing
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.authToken;

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string };
            req.userId = decoded.userId;
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Admin authentication middleware
 */
export const authenticateAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // First authenticate the token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.authToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Admin access token required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string; role?: string };

        // First check Admin collection
        const { Admin } = await import('../modules/admin/auth/admin.model');
        const admin = await Admin.findById(decoded.userId);

        if (admin) {
            // Found in Admin collection
            if (!admin.isActive) {
                return res.status(403).json({
                    success: false,
                    code: 'ACCOUNT_DEACTIVATED',
                    error: 'Admin account is deactivated'
                });
            }

            req.userId = decoded.userId;
            req.user = { userId: decoded.userId, email: admin.email, role: admin.role };
            return next();
        }

        // Fallback: Check User collection for backward compatibility
        const { User } = await import('../models/auth.model');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                code: 'AUTH_REQUIRED',
                error: 'Admin not found'
            });
        }

        // Check if user is admin
        const userRole = (user as any).role || 'user';
        if (userRole !== 'admin' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                code: 'FORBIDDEN',
                error: 'Admin access required'
            });
        }

        // Check account status
        if (user.accountStatus === 'suspended' || user.accountStatus === 'locked') {
            return res.status(403).json({
                success: false,
                code: user.accountStatus === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_LOCKED',
                error: `Account is ${user.accountStatus}.`
            });
        }

        req.userId = decoded.userId;
        req.user = { ...decoded, role: userRole };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid admin token'
        });
    }
};
