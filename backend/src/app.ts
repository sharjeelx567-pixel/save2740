import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import dashboardRoutes from './routes/dashboard.routes';
import walletRoutes from './routes/wallet.routes';
import groupsRoutes from './routes/groups.routes';
import referralsRoutes from './routes/referrals.routes';
import save2740Routes from './routes/save2740.routes';
import saverPocketsRoutes from './routes/saver-pockets.routes';
import paymentsRoutes from './routes/payments.routes';
import paymentMethodsRoutes from './routes/payment-methods-v2.routes'; // PCI-compliant SetupIntent flow
import notificationsRoutes from './routes/notifications.routes';
import feesRoutes from './routes/fees.routes';
import kycRoutes from './routes/kyc.routes';
import supportRoutes from './routes/support.routes';
import supportChatRoutes from './routes/support-chat.routes';
import accountRoutes from './routes/account.routes';
import dailySavingsRoutes from './routes/daily-savings.routes';
import quoteOfDayRoutes from './routes/quote-of-day.routes';
import healthRoutes from './routes/health.routes';
import webhooksRoutes from './routes/webhooks.routes';
import bankingRoutes from './routes/banking.routes';
import adminRoutes from './routes/admin.routes';
import adminUsersRoutes from './routes/admin-users.routes';
import adminAuthRoutes from './routes/admin/auth.routes';
import adminDashboardRoutes from './routes/admin/dashboard.routes';
import adminChatRoutes from './routes/admin/chat.routes';
import fcmRoutes from './routes/fcm.routes';
import adminTransactionsRoutes from './routes/admin/transactions.routes';
import adminNotificationsRoutes from './routes/admin/notifications.routes';
import adminSupportTicketsRoutes from './routes/admin/support-tickets.routes';
import adminAuditLogsRoutes from './routes/admin/audit-logs.routes';
import adminSystemConfigRoutes from './routes/admin/system-config.routes';
import adminPaymentsRoutes from './routes/admin/payments.routes';
import chatNotificationRoutes from './routes/chat-notification.routes';
import complianceRoutes from './routes/compliance.routes';
import fundingRoutes from './routes/funding.routes';
import subscriptionRoutes from './routes/subscription.routes';
import testRoutes from './routes/test.routes'; // Development testing only
import cronTestRoutes from './routes/cron-test.routes'; // Cron job testing



// Middleware
import { errorHandler } from './middleware/error-handler';
import {
    requestId,
    securityHeaders,
    xssProtection,
    preventInjection,
    sanitizeBodyMiddleware,
    auditLog
} from './middleware/security';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

import { connectDB, getConnectionStatus } from './config/db';

const app: Application = express();

// ====================================
// CRITICAL: DISABLE ETAG TO PREVENT 304
// ====================================
app.disable("etag");

// ====================================
// CACHE CONTROL MIDDLEWARE
// ====================================
// This middleware ensures ALL dynamic APIs return HTTP 200 (never 304)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
    // Define static endpoints that CAN be cached
    const staticEndpoints = [
        '/health',
        '/api/health',
        '/api/fees',
        '/api/quote-of-day'
    ];

    // Check if this is a static endpoint
    const isStatic = staticEndpoints.some(endpoint => req.path === endpoint || req.path.startsWith(endpoint));

    if (isStatic) {
        // Allow caching for static endpoints
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
        // Force HTTP 200 for all dynamic endpoints (wallet, dashboard, transactions, notifications, chat, KYC, admin)
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }

    next();
});

// Database Connection Middleware for Serverless (with timeout)
app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!getConnectionStatus()) {
            // Add timeout to prevent hanging if DB is slow/unresponsive
            const connectionPromise = connectDB();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database connection timeout (25s)')), 25000)
            );

            await Promise.race([connectionPromise, timeoutPromise]);
        }
        next();
    } catch (error: any) {
        console.error('Database connection failed:', error.message);
        // Log masked URI for debugging
        const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'undefined';
        console.error('DB URI Configured:', uri.startsWith('mongodb') ? 'YES' : 'NO');

        res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable (DB Connection).',
            code: 'DB_CONNECTION_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
});

// Request ID for tracking
app.use(requestId);

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(xssProtection);
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(cookieParser()); // Parse cookies

// CORS configuration - UPDATED FOR VERCEL
// CORS configuration - UPDATED FOR VERCEL
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_PANEL_URL,
    'http://localhost:3000',
    'http://localhost:3001', // Admin panel
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://save-2740-frrontend.vercel.app',
    'https://save-2740-frontend.vercel.app',
    'https://save2740-ten.vercel.app', // Explicitly added user's frontend
].filter(Boolean).map(origin => origin?.replace(/\/$/, '')); // User might add trailing slash in env, remove it

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // Check allowed origins
        const isAllowed = allowedOrigins.includes(origin) ||
            allowedOrigins.some(o => o && origin.startsWith(o)) ||
            /\.vercel\.app$/.test(origin); // Allow ANY vercel app (preview/prod)

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('BLOCKED CORS:', origin); // Log blocked origins for debugging
            // For debugging, temporarily allow ALL if production fails 
            // callback(null, true); 
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'If-None-Match', 'If-Modified-Since', 'Idempotency-Key', 'X-Idempotency-Key', 'X-CSRF-Token'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Input sanitization and injection prevention
app.use(sanitizeBodyMiddleware);
app.use(preventInjection);

// Audit logging for sensitive operations
app.use(auditLog);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting - ADJUSTED FOR SERVERLESS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 5000 : 100, // limit each IP to 100 requests per windowMs (5000 in dev)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route - API Documentation  
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: "Save2740 API",
        status: "operational",
        version: "1.0.0",
        documentation: "See API_ENDPOINTS_LIST.md for flat list of all endpoints",
        base_url: "/api",
        total_endpoints: 160,
        endpoints: [
            // Authentication - User
            "POST /api/auth/signup",
            "POST /api/auth/verify-email",
            "POST /api/auth/login",
            "POST /api/auth/logout",
            "POST /api/auth/forgot-password",
            "POST /api/auth/reset-password",
            "POST /api/auth/refresh",
            "GET /api/auth/me",

            // Authentication - Admin
            "POST /api/admin/auth/login",
            "GET /api/admin/auth/me",

            // Profile
            "GET /api/profile",
            "PUT /api/profile",
            "PUT /api/profile/avatar",
            "PUT /api/profile/password",
            "PUT /api/profile/email",
            "PUT /api/profile/change-phone",

            // Dashboard
            "GET /api/dashboard/overview",
            "GET /api/dashboard/stats",
            "GET /api/dashboard/streak",
            "GET /api/dashboard/achievements",
            "GET /api/dashboard/breakdown",
            "GET /api/dashboard/savings-breakdown",
            "GET /api/dashboard/contribution",
            "GET /api/dashboard/projections",
            "POST /api/dashboard/contribution",

            // Wallet
            "GET /api/wallet",
            "GET /api/wallet/transactions",
            "POST /api/wallet/deposit",
            "POST /api/wallet/withdraw",
            "GET /api/wallet/limits",

            // Groups
            "GET /api/groups",
            "POST /api/groups",
            "GET /api/groups/:id",
            "POST /api/groups/join",
            "POST /api/groups/leave",
            "POST /api/groups/:id/contribute",
            "GET /api/groups/:id/transactions",

            // Referrals
            "GET /api/referrals/stats",
            "GET /api/referrals/list",

            // Save2740 Challenge
            "GET /api/save2740",
            "GET /api/save2740/status",
            "POST /api/save2740/join",
            "POST /api/save2740/contribute",
            "POST /api/save2740/pause",
            "POST /api/save2740/resume",
            "POST /api/save2740/cancel",

            // Saver Pockets
            "GET /api/saver-pockets",
            "POST /api/saver-pockets",
            "PUT /api/saver-pockets/:id",
            "DELETE /api/saver-pockets/:id",
            "POST /api/saver-pockets/:id/fund",

            // Payments
            "GET /api/payments",
            "POST /api/payments/intent",
            "GET /api/payments/auto-debit",
            "POST /api/payments/auto-debit",
            "GET /api/payments/receipts",
            "GET /api/payments/receipts/:receiptNumber",
            "GET /api/payments/receipts/:receiptNumber/html",
            "POST /api/payments/:transactionId/retry",

            // Payment Methods
            "GET /api/payment-methods",
            "POST /api/payment-methods",
            "DELETE /api/payment-methods/:id",

            // Notifications
            "GET /api/notifications",
            "PUT /api/notifications/:id/read",
            "PUT /api/notifications/all/read",

            // KYC
            "GET /api/kyc/status",
            "POST /api/kyc/upload-id",
            "POST /api/kyc/selfie",
            "POST /api/kyc/address",
            "POST /api/kyc/submit",

            // Support
            "POST /api/support/ticket",

            // Support Chat
            "GET /api/support-chat/messages",
            "POST /api/support-chat/send",
            "PATCH /api/support-chat/messages",
            "GET /api/support-chat/history",
            "POST /api/support-chat/message",

            // Account
            "GET /api/account/linked-accounts",
            "POST /api/account/close",
            "DELETE /api/account",

            // Daily Savings
            "GET /api/daily-savings",
            "POST /api/daily-savings",

            // Banking
            "GET /api/banking",

            // Fees
            "GET /api/fees",

            // Quote of Day
            "GET /api/quote-of-day",

            // FCM
            "POST /api/fcm/register",
            "POST /api/fcm/unregister",
            "POST /api/fcm/test",

            // Chat Notifications
            "POST /api/chat-notification/user-message",
            "POST /api/chat-notification/admin-reply",

            // Admin Dashboard
            "GET /api/admin/dashboard/stats",
            "GET /api/admin/dashboard/activity",
            "GET /api/admin/dashboard/alerts",

            // Admin Users
            "GET /api/admin/users",
            "GET /api/admin/users/:userId",
            "GET /api/admin/users/stats/overview",
            "POST /api/admin/users/lock",
            "POST /api/admin/users/unlock",
            "POST /api/admin/users/suspend",
            "POST /api/admin/users/force-logout",
            "POST /api/admin/users/reset-verification",

            // Admin KYC
            "GET /api/admin/kyc/pending",
            "GET /api/admin/kyc/:userId",
            "POST /api/admin/kyc/approve",
            "POST /api/admin/kyc/reject",
            "POST /api/admin/kyc/request-reupload",
            "GET /api/admin/kyc/audit-log/:kycId",

            // Admin Chat
            "GET /api/admin/chat/users",
            "GET /api/admin/chat/:userId/profile",
            "GET /api/admin/chat/:userId/history",
            "POST /api/admin/chat/log",

            // Admin Transactions
            "GET /api/admin/transactions",
            "GET /api/admin/transactions/stats",
            "GET /api/admin/transactions/export",

            // Admin Notifications
            "POST /api/admin/notifications/send",
            "GET /api/admin/notifications/history",

            // Admin Support Tickets
            "GET /api/admin/support-tickets",
            "GET /api/admin/support-tickets/stats",
            "GET /api/admin/support-tickets/:ticketId",
            "POST /api/admin/support-tickets/:ticketId/reply",
            "PATCH /api/admin/support-tickets/:ticketId/assign",
            "PATCH /api/admin/support-tickets/:ticketId/status",
            "PATCH /api/admin/support-tickets/:ticketId/priority",

            // Admin Audit Logs
            "GET /api/admin/audit-logs",
            "GET /api/admin/audit-logs/stats",
            "GET /api/admin/audit-logs/:logId",
            "GET /api/admin/audit-logs/user/:userId",

            // Admin System Config
            "GET /api/admin/system-config",
            "GET /api/admin/system-config/:key",
            "POST /api/admin/system-config",
            "PUT /api/admin/system-config/:key",
            "DELETE /api/admin/system-config/:key",
            "GET /api/admin/system-config/categories/list",

            // Admin Payments
            "GET /api/admin/payments",
            "GET /api/admin/payments/stats",
            "GET /api/admin/payments/:transactionId",
            "POST /api/admin/payments/:transactionId/refund",
            "GET /api/admin/payments/disputes/list",
            "GET /api/admin/payments/wallets/balances",

            // Webhooks
            "POST /api/webhooks/stripe",

            // Health
            "GET /",
            "GET /health",
            "GET /api/health",
            "GET /api/health/ready",
            "GET /api/health/live"
        ]
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/save2740', save2740Routes);
app.use('/api/saver-pockets', saverPocketsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/payments/methods', paymentMethodsRoutes); // Alias for frontend compatibility
app.use('/api/notifications', notificationsRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/support-chat', supportChatRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/user', accountRoutes); // Alias for account routes (delete-account)
app.use('/api/daily-savings', dailySavingsRoutes);
app.use('/api/quote-of-day', quoteOfDayRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/chat', adminChatRoutes);
app.use('/api/admin/transactions', adminTransactionsRoutes);
app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/admin/support-tickets', adminSupportTicketsRoutes);
app.use('/api/admin/audit-logs', adminAuditLogsRoutes);
app.use('/api/admin/system-config', adminSystemConfigRoutes);
app.use('/api/admin/payments', adminPaymentsRoutes);
app.use('/api/fcm', fcmRoutes);
app.use('/api/chat-notification', chatNotificationRoutes);
app.use('/api/funding', fundingRoutes);

// Development Testing Routes (only in development)
if (process.env.NODE_ENV !== 'production') {
    app.use('/api/test', testRoutes);
    app.use('/api/cron-test', cronTestRoutes);
    console.log('🧪 Test routes enabled at /api/test');
    console.log('⏰ Cron test routes enabled at /api/cron-test');
}


// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handling middleware
app.use(errorHandler);

// VERCEL SERVERLESS EXPORT  
// This is crucial for Vercel deployment
export default app;
