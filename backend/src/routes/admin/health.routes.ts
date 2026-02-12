import express, { Response } from 'express';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { connectDB, getConnectionStatus } from '../../config/db';
import os from 'os';

const router = express.Router();

// GET /api/admin/health - System health overview
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const dbStatus = getConnectionStatus();

        const health = {
            status: dbStatus ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memoryUsage: process.memoryUsage(),
                cpuLoad: os.loadavg(),
                freeMem: os.freemem(),
                totalMem: os.totalmem()
            },
            database: {
                connected: dbStatus,
            },
            providers: {
                stripe: 'checking...',
                twilio: 'checking...',
                kyc: 'checking...'
            }
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('Admin health check error:', error);
        res.status(500).json({ success: false, error: 'Health check failed' });
    }
});

export default router;
