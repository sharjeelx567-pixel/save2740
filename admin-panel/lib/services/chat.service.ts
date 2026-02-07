/**
 * Chat Service - Admin Panel
 * Real-time messaging with Firebase Firestore
 * Admin can chat with users and see their context
 */

import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  setDoc,
  getDocs,
  where,
  Unsubscribe,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { api } from '../api';

export interface ChatMessage {
  id: string;
  message: string;
  senderType: 'user' | 'admin';
  senderId: string;
  senderName?: string;
  timestamp: Date;
  read?: boolean;
}

export interface ChatUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  kycStatus: string;
  accountStatus: string;
  lastMessage: string;
  lastTimestamp: Date;
  messageCount: number;
}

class AdminChatService {
  /**
   * Send message as admin
   */
  async sendMessage(
    userId: string,
    message: string,
    adminId: string,
    adminName: string
  ): Promise<void> {
    try {
      // Add message to Firestore
      const messagesRef = collection(db, `chats/${userId}/messages`);
      await addDoc(messagesRef, {
        message,
        senderType: 'admin',
        senderId: adminId,
        // senderName removed
        timestamp: Timestamp.now(),
        read: false,
      });

      // Update chat session
      await this.updateChatSession(userId, message);

      // Log to backend for audit
      this.logToBackend(userId, adminId, message, 'admin').catch(err =>
        console.error('Backend log failed:', err)
      );
    } catch (error) {
      console.error('Send message error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Subscribe to messages for a specific user
   */
  subscribeToMessages(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe {
    const messagesRef = collection(db, `chats/${userId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message,
            senderType: data.senderType,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp?.toDate() || new Date(),
            read: data.read || false,
          };
        });
        callback(messages);
      },
      (error) => {
        console.error('Subscribe error:', error);
      }
    );
  }

  /**
   * Get list of users with active chats (from backend)
   */
  async getChatUsers(): Promise<ChatUser[]> {
    try {
      const response = await api.get<{ success: boolean; data: ChatUser[] }>(
        '/api/admin/chat/users'
      );
      return response.data || [];
    } catch (error) {
      console.error('Get chat users error:', error);
      return [];
    }
  }

  /**
   * Get user profile with KYC context
   */
  async getUserContext(userId: string): Promise<any> {
    try {
      const response = await api.get<{ success: boolean; data: any }>(
        `/api/admin/chat/${userId}/profile`
      );
      return response.data;
    } catch (error) {
      console.error('Get user context error:', error);
      return null;
    }
  }

  /**
   * Get chat history from backend audit logs
   */
  async getChatHistoryFromBackend(userId: string, limit = 100): Promise<any[]> {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/api/admin/chat/${userId}/history?limit=${limit}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Get chat history error:', error);
      return [];
    }
  }

  /**
   * Update chat session metadata
   */
  private async updateChatSession(userId: string, lastMessage: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'chatSessions', userId);
      await setDoc(
        sessionRef,
        {
          lastMessage,
          lastMessageTime: Timestamp.now(),
          lastMessageByAdmin: true,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Update session error:', error);
    }
  }

  /**
   * Log chat to backend for audit
   */
  private async logToBackend(
    userId: string,
    adminId: string,
    message: string,
    senderType: 'user' | 'admin'
  ): Promise<void> {
    try {
      await api.post('/api/admin/chat/log', {
        userId,
        adminId,
        message,
        senderType,
      });
    } catch (error) {
      console.warn('Backend audit log failed:', error);
    }
  }

  /**
   * Subscribe to all chat sessions (for admin inbox)
   */
  subscribeToAllSessions(callback: (sessions: any[]) => void): Unsubscribe {
    const sessionsRef = collection(db, 'chatSessions');
    const q = query(sessionsRef, orderBy('lastMessageTime', 'desc'), firestoreLimit(50));

    return onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => ({
          userId: doc.id,
          ...doc.data(),
          lastMessageTime: doc.data().lastMessageTime?.toDate(),
        }));
        callback(sessions);
      },
      (error) => {
        console.error('Subscribe to sessions error:', error);
      }
    );
  }
}

export const adminChatService = new AdminChatService();
export default adminChatService;
