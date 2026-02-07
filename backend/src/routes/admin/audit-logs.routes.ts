import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { AuditLog } from '../../models/audit-log';
import { User } from '../../models/auth.model';
import { connectDB } from '../../config/db';

const router = express.Router();

// GET /api/admin/audit-logs - List all audit logs
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { 
            page = 1, 
            limit = 50, 
            resourceType,
            severity,
            userId,
            action,
            startDate,
            endDate
        } = req.query;

        const query: any = {};
        
        if (resourceType && resourceType !== 'all') query.resourceType = resourceType;
        if (severity && severity !== 'all') query.severity = severity;
        if (userId) query.userId = userId;
        if (action) query.action = { $regex: action, $options: 'i' };
        
        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            AuditLog.countDocuments(query)
        ]);

        // Get user details for logs
        const logsWithUsers = await Promise.all(
            logs.map(async (log) => {
                const user = log.userId 
                    ? await User.findById(log.userId).select('email firstName lastName')
                    : null;

                return {
                    ...log.toObject(),
                    user: user ? {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    } : null
                };
            })
        );

        res.json({
            success: true,
            data: {
                logs: logsWithUsers,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ success: false, error: 'Failed to get audit logs' });
    }
});

// GET /api/admin/audit-logs/stats - Get audit log statistics
router.get('/stats', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const [
            totalLogs,
            recentLogs,
            criticalLogs,
            errorLogs,
            logsByType
        ] = await Promise.all([
            AuditLog.countDocuments(),
            AuditLog.countDocuments({ createdAt: { $gte: last7Days } }),
            AuditLog.countDocuments({ severity: 'critical' }),
            AuditLog.countDocuments({ severity: 'error' }),
            AuditLog.aggregate([
                {
                    $group: {
                        _id: '$resourceType',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalLogs,
                recentLogs,
                criticalLogs,
                errorLogs,
                logsByType: logsByType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {} as Record<string, number>)
            }
        });
    } catch (error) {
        console.error('Get audit log stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
});

// GET /api/admin/audit-logs/:logId - Get specific audit log
router.get('/:logId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { logId } = req.params;

        const log = await AuditLog.findById(logId);
        if (!log) {
            return res.status(404).json({ success: false, error: 'Log not found' });
        }

        const user = log.userId 
            ? await User.findById(log.userId).select('-passwordHash')
            : null;

        res.json({
            success: true,
            data: {
                log: log.toObject(),
                user
            }
        });
    } catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({ success: false, error: 'Failed to get log' });
    }
});

// GET /api/admin/audit-logs/user/:userId - Get logs for specific user
router.get('/user/:userId', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await connectDB();
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const [logs, total] = await Promise.all([
            AuditLog.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            AuditLog.countDocuments({ userId })
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get user logs error:', error);
        res.status(500).json({ success: false, error: 'Failed to get user logs' });
    }
});

export default router;
