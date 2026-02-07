/**
 * FCM Token Management Routes
 * Handles registration and management of Firebase Cloud Messaging tokens
 */

import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { fcmService } from '../services/fcm.service';
import { connectDB } from '../config/db';

const router = express.Router();

/**
 * POST /api/fcm/register
 * Register FCM token for push notifications
 */
router.post('/register', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.user?.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'FCM token is required',
      });
    }

    const success = await fcmService.registerToken(userId!, token);

    if (success) {
      res.json({
        success: true,
        message: 'FCM token registered successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to register FCM token',
      });
    }
  } catch (error) {
    console.error('FCM token registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register FCM token',
    });
  }
});

/**
 * POST /api/fcm/unregister
 * Unregister FCM token (on logout or token refresh)
 */
router.post('/unregister', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.user?.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'FCM token is required',
      });
    }

    const success = await fcmService.unregisterToken(userId!, token);

    if (success) {
      res.json({
        success: true,
        message: 'FCM token unregistered successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to unregister FCM token',
      });
    }
  } catch (error) {
    console.error('FCM token unregistration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister FCM token',
    });
  }
});

/**
 * POST /api/fcm/test
 * Test FCM notification (development only)
 */
router.post('/test', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test endpoint not available in production',
      });
    }

    await connectDB();
    const userId = req.user?.userId;

    const success = await fcmService.sendToUser(userId!, {
      title: 'Test Notification',
      body: 'This is a test notification from Save2740',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      success,
      message: success ? 'Test notification sent' : 'Failed to send test notification',
    });
  } catch (error) {
    console.error('FCM test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

export default router;
