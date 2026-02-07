/**
 * Chat Notification Routes
 * Handles FCM notifications and in-app notifications when chat messages are sent
 */

import express, { Response } from 'express';
import { authenticateToken, authenticateAdmin, AuthRequest } from '../middleware/auth';
import { fcmService } from '../services/fcm.service';
import { User } from '../models/auth.model';
import { connectDB } from '../config/db';
import Notification from '../models/Notification';
import { getAdminUserIds } from '../utils/notification-service';

const router = express.Router();

/**
 * POST /api/chat-notification/user-message
 * Notify admins when a user sends a message
 * Called by frontend after message is added to Firestore
 */
router.post('/user-message', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const userId = req.user?.userId;
    const { message, userName } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Get user info
    const user = await User.findById(userId).select('firstName lastName email');
    const senderName = userName || `${user?.firstName} ${user?.lastName}` || user?.email || 'User';

    // All admin IDs (Admin collection + User with role admin) for in-app notifications
    const allAdminIds = await getAdminUserIds();
    // User-collection admins only for FCM (tokens live on User model)
    const userAdmins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      accountStatus: 'active'
    }).select('_id fcmToken fcmTokens');
    const fcmAdminIds = userAdmins.map(a => a._id.toString());

    const successCount = fcmAdminIds.length > 0
      ? await fcmService.sendToMultipleUsers(fcmAdminIds, {
          title: `New message from ${senderName}`,
          body: message.substring(0, 100),
          data: {
            type: 'user_chat',
            userId: userId!,
            userName: senderName,
            timestamp: new Date().toISOString(),
          },
        })
      : 0;

    // Save in-app notification for every admin (Admin + User) so feed shows for all
    if (allAdminIds.length > 0) {
      const notifications = allAdminIds.map(adminId => ({
        userId: adminId,
        type: 'chat_message',
        title: `New message from ${senderName}`,
        message: message.substring(0, 200),
        relatedData: {
          chatUserId: userId,
          chatUserName: senderName,
        },
        read: false,
        channels: { push: true, email: false, sms: false },
        sentAt: new Date(),
      }));
      await Notification.insertMany(notifications);
      console.log(`✅ Notifications saved for ${allAdminIds.length} admin(s)`);
    }

    res.json({
      success: true,
      message: `Notification sent to ${successCount}/${fcmAdminIds.length} admins (${allAdminIds.length} in-app)`,
      notifiedCount: successCount,
    });
  } catch (error) {
    console.error('User message notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
    });
  }
});

/**
 * POST /api/chat-notification/admin-reply
 * Notify user when admin replies
 * Called by admin panel after message is added to Firestore
 */
router.post('/admin-reply', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const adminId = req.user?.userId;
    const { userId, message, adminName } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required',
      });
    }

    // Get admin info
    const admin = await User.findById(adminId).select('firstName lastName email');
    const senderName = adminName || `${admin?.firstName} ${admin?.lastName}` || 'Support Team';

    // Send FCM push notification to user
    const success = await fcmService.sendAdminReplyNotification(
      userId,
      senderName,
      message
    );

    // Save in-app notification for user
    console.log(`📬 Creating notification for user: ${userId}`);
    const notification = await Notification.create({
      userId: userId,
      type: 'support_reply',
      title: `${senderName} replied`,
      message: message.substring(0, 200),
      relatedData: {
        adminId: adminId,
        adminName: senderName,
      },
      read: false,
      channels: {
        push: true,
        email: false,
        sms: false,
      },
      sentAt: new Date(),
    });
    console.log(`✅ User notification created: ${notification._id}`);

    res.json({
      success,
      message: success ? 'Notification sent to user' : 'Failed to send notification',
    });
  } catch (error) {
    console.error('Admin reply notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
    });
  }
});

export default router;
