/**
 * Security Middleware
 * Additional security measures beyond helmet
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip for webhook endpoints (they use signature verification)
    if (req.path.startsWith('/api/webhooks/')) {
        return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    const sessionToken = req.cookies?.csrfToken;

    if       (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        return res.status(403).json({
            success: false,
            error: 'Invalid CSRF token',
            code: 'CSRF_VALIDATION_FAILED'
        });
    }

    next();
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(req: Request, res: Response): string {
    const token = crypto.randomBytes(32).toString('hex');

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('csrfToken', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
    });

    return token;
}

/**
 * XSS Protection Headers
 */
export function xssProtection(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://api.stripe.com; " +
        "frame-src https://js.stripe.com"
    );
    next();
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: any): any {
    if (typeof input === 'string') {
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    }

    if (Array.isArray(input)) {
        return input.map(item => sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
        const sanitized: any = {};
        for (const key in input) {
            sanitized[key] = sanitizeInput(input[key]);
        }
        return sanitized;
    }

    return input;
}

/**
 * Input sanitization middleware
 */
export function sanitizeBodyMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    next();
}

/**
 * IP-based rate limiting using Redis
 */
export async function ipRateLimit(
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { checkRateLimit } = await import('../config/redis');

            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `ip_ratelimit:${ip}`;

            const allowed = await checkRateLimit(key, maxRequests, windowMs);

            if (!allowed) {
                return res.status(429).json({
                    success: false,
                    error: 'Too many requests from this IP address',
                    code: 'RATE_LIMIT_EXCEEDED'
                });
            }

            next();
        } catch (error) {
            // If Redis is unavailable, allow the request
            console.error('IP rate limit error:', error);
            next();
        }
    };
}

/**
 * Request ID middleware for tracking
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
    const requestId = crypto.randomBytes(16).toString('hex');
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy',
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );

    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    next();
}

/**
 * Validate request origin
 */
export function validateOrigin(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001'
    ].filter(Boolean);

    const origin = req.headers.origin;

    // Skip validation for same-origin requests
    if (!origin) {
        return next();
    }

    if (allowedOrigins.includes(origin)) {
        return next();
    }

    // Log suspicious requests
    console.warn(`Suspicious request from origin: ${origin}, IP: ${req.ip}`);

    return res.status(403).json({
        success: false,
        error: 'Forbidden origin',
        code: 'INVALID_ORIGIN'
    });
}

/**
 * SQL/NoSQL Injection Prevention
 * Basic validation for common injection patterns
 */
export function preventInjection(req: Request, res: Response, next: NextFunction) {
    const checkValue = (value: any): boolean => {
        if (typeof value === 'string') {
            // Check for common injection patterns
            const injectionPatterns = [
                /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin)/i, // MongoDB operators in strings
                /(union\s+select|insert\s+into|delete\s+from|drop\s+table)/i, // SQL injection
                /(\;\s*drop|\;\s*delete|\;\s*insert)/i // SQL command injection
            ];

            return injectionPatterns.some(pattern => pattern.test(value));
        }

        if (Array.isArray(value)) {
            return value.some(item => checkValue(item));
        }

        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(item => checkValue(item));
        }

        return false;
    };

    // Check query parameters
    if (checkValue(req.query)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid query parameters detected',
            code: 'INJECTION_ATTEMPT'
        });
    }

    // Check body
    if (checkValue(req.body)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request body detected',
            code: 'INJECTION_ATTEMPT'
        });
    }

    next();
}

/**
 * Audit log middleware
 */
export async function auditLog(req: Request, res: Response, next: NextFunction) {
    // Only log sensitive operations
    const sensitiveOperations = [
        '/api/auth/login',
        '/api/auth/signup',
        '/api/wallet/withdraw',
        '/api/payment',
        '/api/kyc',
        '/api/account'
    ];

    const shouldLog = sensitiveOperations.some(path => req.path.startsWith(path));

    if (shouldLog) {
        try {
            const { addAnalyticsJob } = await import('../utils/job-queue');
            await addAnalyticsJob({
                event: 'api_request',
                userId: (req as any).userId,
                metadata: {
                    method: req.method,
                    path: req.path,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
        } catch (error) {
            console.error('Audit log error:', error);
        }
    }

    next();
}

export default {
    csrfProtection,
    generateCsrfToken,
    xssProtection,
    sanitizeInput,
    sanitizeBodyMiddleware,
    ipRateLimit,
    requestId,
    securityHeaders,
    validateOrigin,
    preventInjection,
    auditLog
};
