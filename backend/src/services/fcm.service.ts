/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications for chat messages and other events
 */


import { getMessaging } from '../config/firebase-admin';
import { User } from '../models/auth.model';

export interface FCMNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

class FCMService {
  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, payload: FCMNotificationPayload): Promise<boolean> {
    try {
      // Get user's FCM token from database
      const user = await User.findById(userId).select('fcmToken fcmTokens');

      if (!user) {
        console.warn(`User ${userId} not found for FCM notification`);
        return false;
      }

      // Support both single token and multiple tokens
      const tokens: string[] = [];
      if (user.fcmToken) {
        tokens.push(user.fcmToken);
      }
      if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
        tokens.push(...user.fcmTokens);
      }

      // Remove duplicates
      const uniqueTokens = [...new Set(tokens)];

      if (uniqueTokens.length === 0) {
        console.warn(`No FCM tokens found for user ${userId}`);
        return false;
      }

      // Send to all tokens
      const results = await Promise.allSettled(
        uniqueTokens.map(token => this.sendToToken(token, payload))
      );

      // Check if at least one succeeded
      const hasSuccess = results.some(r => r.status === 'fulfilled' && r.value);
      return hasSuccess;
    } catch (error) {
      console.error('Send FCM to user error:', error);
      return false;
    }
  }

  /**
   * Send notification to a specific FCM token
   */
  async sendToToken(token: string, payload: FCMNotificationPayload): Promise<boolean> {
    try {
      const messaging = getMessaging();

      const message: any = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'chat_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
          },
        },
      };

      if (payload.imageUrl) {
        message.notification.imageUrl = payload.imageUrl;
      }

      await messaging.send(message);
      console.log(`✅ FCM notification sent to token: ${token.substring(0, 20)}...`);
      return true;
    } catch (error: any) {
      // Handle invalid token errors
      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
        console.warn(`Invalid FCM token, removing: ${token.substring(0, 20)}...`);
        // TODO: Remove invalid token from user's record
        return false;
      }

      console.error('Send FCM to token error:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], payload: FCMNotificationPayload): Promise<number> {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, payload))
    );

    const successCount = results.filter(
      r => r.status === 'fulfilled' && r.value
    ).length;

    return successCount;
  }

  /**
   * Send chat message notification
   */
  async sendChatNotification(
    recipientUserId: string,
    senderName: string,
    message: string,
    chatId: string
  ): Promise<boolean> {
    return this.sendToUser(recipientUserId, {
      title: `New message from ${senderName}`,
      body: message.substring(0, 100), // Truncate long messages
      data: {
        type: 'chat',
        chatId,
        senderId: recipientUserId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send admin reply notification to user
   */
  async sendAdminReplyNotification(
    userId: string,
    adminName: string,
    message: string
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: `${adminName} replied to your message`,
      body: message.substring(0, 100),
      data: {
        type: 'admin_reply',
        chatId: userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Register/Update FCM token for a user
   */
  async registerToken(userId: string, fcmToken: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      // Initialize fcmTokens array if it doesn't exist
      if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
        user.fcmTokens = [];
      }

      // Add token if not already present
      if (!user.fcmTokens.includes(fcmToken)) {
        user.fcmTokens.push(fcmToken);

        // Keep only the last 5 tokens
        if (user.fcmTokens.length > 5) {
          user.fcmTokens = user.fcmTokens.slice(-5);
        }
      }

      // Also set as primary token
      user.fcmToken = fcmToken;
      await user.save();

      console.log(`✅ FCM token registered for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Register FCM token error:', error);
      return false;
    }
  }

  /**
   * Unregister FCM token for a user
   */
  async unregisterToken(userId: string, fcmToken: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      // Remove from array
      if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
        user.fcmTokens = user.fcmTokens.filter((t: string) => t !== fcmToken);
      }

      // Clear primary token if it matches
      if (user.fcmToken === fcmToken) {
        user.fcmToken = undefined;
      }

      await user.save();
      return true;
    } catch (error) {
      console.error('Unregister FCM token error:', error);
      return false;
    }
  }
}

export const fcmService = new FCMService();
export default fcmService;
