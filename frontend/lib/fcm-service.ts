/**
 * FCM (Firebase Cloud Messaging) Service - Frontend
 * Handles push notification token registration and management
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import { apiClient } from './api-client';

class FCMService {
  private messaging: Messaging | null = null;
  private vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
  private initializationAttempted = false;
  private isConfigured = false;

  constructor() {
    // Check if FCM is properly configured
    this.isConfigured = !!(
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );

    if (!this.isConfigured && typeof window !== 'undefined') {
      // Log once, don't spam
      console.info('ℹ️  FCM not configured - push notifications disabled. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to enable.');
    }
  }

  /**
   * Initialize FCM messaging
   */
  private initializeMessaging(): Messaging | null {
    if (typeof window === 'undefined' || !this.isConfigured) {
      return null;
    }

    if (!this.messaging) {
      try {
        this.messaging = getMessaging(app);
      } catch (error) {
        // Only log if this is unexpected
        if (this.isConfigured) {
          console.warn('FCM messaging initialization failed:', error);
        }
        return null;
      }
    }

    return this.messaging;
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    // Skip if FCM is not configured
    if (!this.isConfigured) {
      return null;
    }

    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Initialize messaging
      const messaging = this.initializeMessaging();
      if (!messaging) {
        return null;
      }

      // Get registration token
      try {
        // Check if VAPID key is configured
        if (!this.vapidKey) {
          console.warn('FCM VAPID key not configured. Push notifications will not work.');
          return null;
        }

        const token = await getToken(messaging, {
          vapidKey: this.vapidKey
        });

        if (token) {
          console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
          return token;
        } else {
          console.log('No FCM token available');
          return null;
        }
      } catch (tokenError: any) {
        // Handle specific errors
        if (tokenError.code === 'messaging/permission-blocked') {
          console.warn('Notification permission blocked by user');
        } else if (tokenError.name === 'InvalidAccessError') {
          console.warn('FCM VAPID key is invalid or not configured. Please add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env.local');
        } else {
          console.error('Failed to get FCM token:', tokenError);
        }
        return null;
      }
    } catch (error) {
      console.error('FCM permission/token error:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(token: string): Promise<boolean> {
    try {
      await apiClient.post('/fcm/register', { token });
      console.log('✅ FCM token registered with backend');
      return true;
    } catch (error) {
      console.error('Failed to register FCM token with backend:', error);
      return false;
    }
  }

  /**
   * Unregister FCM token from backend
   */
  async unregisterToken(token: string): Promise<boolean> {
    try {
      await apiClient.post('/fcm/unregister', { token });
      console.log('✅ FCM token unregistered from backend');
      return true;
    } catch (error) {
      console.error('Failed to unregister FCM token:', error);
      return false;
    }
  }

  /**
   * Initialize FCM and register token
   * Call this after user login
   */
  async initialize(): Promise<void> {
    try {
      const token = await this.requestPermissionAndGetToken();

      if (token) {
        await this.registerToken(token);

        // Listen for foreground messages
        this.listenForMessages();
      }
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  /**
   * Listen for foreground messages
   */
  private listenForMessages(): void {
    const messaging = this.initializeMessaging();
    if (!messaging) {
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Show notification
      if (payload.notification) {
        this.showNotification(
          payload.notification.title || 'New Message',
          payload.notification.body || '',
          payload.data
        );
      }
    });
  }

  /**
   * Show browser notification
   */
  private showNotification(title: string, body: string, data?: any): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: data?.type || 'chat',
        data,
      });

      notification.onclick = () => {
        // Handle notification click
        window.focus();
        notification.close();

        // Navigate to chat if it's a chat notification
        if (data?.type === 'admin_reply' || data?.type === 'chat') {
          // You can dispatch a custom event or use your routing logic here
          window.dispatchEvent(new CustomEvent('open-chat', { detail: data }));
        }
      };
    }
  }

  /**
   * Check if notifications are supported and enabled
   */
  isSupported(): boolean {
    return this.isConfigured &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission | null {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }
    return Notification.permission;
  }
}

export const fcmService = new FCMService();
export default fcmService;

