/**
 * Chat Service - Frontend (User App)
 * Real-time messaging with Firebase Firestore
 * Audit logging to backend MongoDB
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
  getDoc,
  Unsubscribe,
  limit,
  getDocs,
} from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  message: string;
  senderType: 'user' | 'admin';
  senderId: string;
  senderName?: string;
  timestamp: Date;
  read?: boolean;
}

class ChatService {
  /**
   * Send a message to admin
   */
  async sendMessage(userId: string, message: string): Promise<void> {
    try {
      // Add message to Firestore
      const messagesRef = collection(db, `chats/${userId}/messages`);
      await addDoc(messagesRef, {
        message,
        senderType: 'user',
        senderId: userId,
        // senderName removed to ensure userId is source of truth
        timestamp: Timestamp.now(),
        read: false,
      });

      // Update chat session metadata
      await this.updateChatSession(userId, message);
    } catch (error) {
      console.error('Send message error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Subscribe to messages for a user
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
   * Get chat history
   */
  async getChatHistory(userId: string, limitCount = 100): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, `chats/${userId}/messages`);
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((doc) => {
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
        })
        .reverse();
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
      const data: any = {
        lastMessage,
        lastMessageTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(
        sessionRef,
        data,
        { merge: true }
      );
    } catch (error) {
      console.error('Update session error:', error);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(userId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'chatSessions', userId);
      await setDoc(
        sessionRef,
        {
          unreadCount: 0,
          lastReadAt: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const sessionRef = doc(db, 'chatSessions', userId);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        return sessionDoc.data()?.unreadCount || 0;
      }
      return 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }
}

export const chatService = new ChatService();
export default chatService;

