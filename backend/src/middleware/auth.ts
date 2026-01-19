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
        // Get token from Authorization header or cookie
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.authToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string };

        // Attach user ID to request
        req.userId = decoded.userId;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
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

        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        req.userId = decoded.userId;
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid admin token'
        });
    }
};
