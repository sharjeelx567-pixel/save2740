import express, { Response } from 'express';
// We'll use a simple placeholder model logic since Notification model might not exist or needs defining
// If you have a Notification model, import it here. For now I'll check if file exists or simulate it.
import mongoose, { Schema } from 'mongoose';
import { connectDB } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

import Notification from '../models/Notification'; // Use default import as exported



// GET /api/notifications - Get all notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    console.log(`[DEBUG] Fetching notifications for user: ${req.userId}`);
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    console.log(`[DEBUG] Found ${notifications.length} notifications`);

    // Check unread count
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        items: notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Verify ownership before marking as read
    const notification = await Notification.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found or unauthorized' 
      });
    }

    // Critical notifications cannot be marked as read without acknowledgment
    if (notification.isCritical && !notification.acknowledgedAt) {
      return res.status(400).json({
        success: false,
        error: 'Critical notifications must be acknowledged first',
        code: 'REQUIRES_ACKNOWLEDGMENT'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
});

// POST /api/notifications/mark-all-read - Mark all non-critical as read
router.post('/mark-all-read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    // Only mark non-critical notifications as read
    const result = await Notification.updateMany(
      { 
        userId: req.userId, 
        read: false,
        isCritical: false // Don't auto-mark critical alerts
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );

    res.json({ 
      success: true, 
      message: `${result.modifiedCount} notifications marked as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

// POST /api/notifications/:id/acknowledge - Acknowledge critical alert
router.post('/:id/acknowledge', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    if (!notification.isCritical) {
      return res.status(400).json({
        success: false,
        error: 'Only critical notifications require acknowledgment'
      });
    }

    notification.acknowledgedAt = new Date();
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    // Log critical alert acknowledgment for audit
    console.log(`🔒 [SECURITY] Critical alert acknowledged: User ${req.userId} acknowledged notification ${notification._id} (${notification.type})`);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Acknowledge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge notification'
    });
  }
});

// DELETE /api/notifications/:id - Delete/dismiss notification
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    // Critical notifications cannot be dismissed
    if (notification.isCritical) {
      return res.status(403).json({
        success: false,
        error: 'Critical notifications cannot be dismissed',
        code: 'CRITICAL_CANNOT_DISMISS'
      });
    }

    notification.dismissedAt = new Date();
    await notification.save();

    // Soft delete - mark as dismissed instead of hard delete
    console.log(`🗑️  Notification dismissed: ${notification._id} by user ${req.userId}`);

    res.json({
      success: true,
      message: 'Notification dismissed'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

export default router;
