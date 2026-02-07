/**
 * FCM (Firebase Cloud Messaging) Service - Admin Panel
 * Handles push notification token registration for admins
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';

class AdminFCMService {
  private messaging: Messaging | null = null;
  private vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
  private apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  /**
   * Initialize FCM messaging
   */
  private initializeMessaging(): Messaging | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.messaging) {
      try {
        this.messaging = getMessaging(app);
      } catch (error) {
        console.warn('[Admin FCM] Messaging initialization failed:', error);
        return null;
      }
    }

    return this.messaging;
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[Admin FCM] Notifications not supported');
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('[Admin FCM] Permission denied');
        return null;
      }

      // Initialize messaging
      const messaging = this.initializeMessaging();
      if (!messaging) {
        return null;
      }

      // Get registration token
      try {
        if (!this.vapidKey) {
          console.warn('[Admin FCM] VAPID key not configured');
          return null;
        }

        const token = await getToken(messaging, { 
          vapidKey: this.vapidKey 
        });
        
        if (token) {
          console.log('✅ [Admin FCM] Token obtained:', token.substring(0, 20) + '...');
          return token;
        } else {
          console.log('[Admin FCM] No token available');
          return null;
        }
      } catch (tokenError: any) {
        if (tokenError.code === 'messaging/permission-blocked') {
          console.warn('[Admin FCM] Permission blocked');
        } else if (tokenError.name === 'InvalidAccessError') {
          console.warn('[Admin FCM] Invalid VAPID key. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env.local');
        } else {
          console.error('[Admin FCM] Token error:', tokenError);
        }
        return null;
      }
    } catch (error) {
      console.error('[Admin FCM] Permission/token error:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(token: string): Promise<boolean> {
    try {
      const authToken = localStorage.getItem('adminToken');
      if (!authToken) {
        console.warn('[Admin FCM] No auth token');
        return false;
      }

      const response = await fetch(`${this.apiUrl}/api/fcm/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        console.log('✅ [Admin FCM] Token registered with backend');
        return true;
      } else {
        console.error('[Admin FCM] Registration failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[Admin FCM] Registration error:', error);
      return false;
    }
  }

  /**
   * Initialize FCM and register token
   * Call this after admin login
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
      console.error('[Admin FCM] Initialization error:', error);
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
      console.log('[Admin FCM] Foreground message:', payload);
      
      // Show notification
      if (payload.notification) {
        this.showNotification(
          payload.notification.title || 'New User Message',
          payload.notification.body || '',
          payload.data
        );
      }

      // Play sound
      this.playNotificationSound();

      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('admin-new-message', { 
        detail: payload.data 
      }));
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
        tag: data?.type || 'user_message',
        data,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to chat
        if (data?.userId) {
          window.location.href = '/support/live-chat';
        }
      };
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Pleasant notification tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (error) {
      console.error('[Admin FCM] Sound error:', error);
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
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

export const adminFCMService = new AdminFCMService();
export default adminFCMService;
