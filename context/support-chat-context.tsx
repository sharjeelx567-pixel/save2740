"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ChatMessage {
    _id: string;
    sessionId: string;
    sender: 'user' | 'admin';
    message: string;
    read: boolean;
    createdAt: string;
}

interface ChatSession {
    _id: string;
    userId: string;
    status: 'active' | 'resolved';
    lastMessageAt: string;
    createdAt: string;
}

interface SupportChatContextType {
    isOpen: boolean;
    messages: ChatMessage[];
    sessionId: string | null;
    unreadCount: number;
    isLoading: boolean;
    isTyping: boolean;
    openChat: () => void;
    closeChat: () => void;
    sendMessage: (text: string) => Promise<void>;
    loadMessages: () => Promise<void>;
    markAsRead: () => Promise<void>;
}

const SupportChatContext = createContext<SupportChatContextType | undefined>(undefined);

export function SupportChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        // Check for token in localStorage or cookies
        if (typeof window === 'undefined') return false;
        
        // Check localStorage for session
        const session = localStorage.getItem('session');
        const user = localStorage.getItem('user');
        
        if (session && user) {
            try {
                const sessionData = JSON.parse(session);
                // Check if session is still valid
                if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
                    return true;
                }
            } catch (e) {
                // Invalid session data
            }
        }
        
        return false;
    }, []);

    // Load messages from API
    const loadMessages = useCallback(async () => {
        // Only make API call if user is authenticated
        if (!isAuthenticated()) {
            return;
        }

        try {
            const url = sessionId
                ? `/api/support-chat/messages?sessionId=${sessionId}`
                : '/api/support-chat/messages';

            const response = await fetch(url, {
                credentials: 'include',
            });

            // Handle 401 silently (user not authenticated)
            if (response.status === 401) {
                // User is not authenticated, clear state and stop polling
                setMessages([]);
                setSessionId(null);
                setUnreadCount(0);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setMessages(data.data.messages || []);
                    if (data.data.session) {
                        setSessionId(data.data.session._id);
                    }

                    // Calculate unread count (admin messages not read)
                    const unread = (data.data.messages || []).filter(
                        (msg: ChatMessage) => msg.sender === 'admin' && !msg.read
                    ).length;
                    setUnreadCount(unread);
                }
            }
        } catch (error) {
            // Only log non-401 errors
            if (error instanceof Error && !error.message.includes('401')) {
                console.error('Error loading messages:', error);
            }
        }
    }, [sessionId, isAuthenticated]);

    // Send a message
    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/support-chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    sessionId,
                    message: text,
                    sender: 'user',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSessionId(data.data.sessionId);
                    // Reload messages to get the new one
                    await loadMessages();
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mark messages as read
    const markAsRead = async () => {
        if (!sessionId) return;

        try {
            await fetch('/api/support-chat/messages', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ sessionId }),
            });

            // Update local state
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.sender === 'admin' ? { ...msg, read: true } : msg
                )
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    // Open chat
    const openChat = () => {
        setIsOpen(true);
        markAsRead();
    };

    // Close chat
    const closeChat = () => {
        setIsOpen(false);
    };

    // Poll for new messages every 5 seconds when chat is open
    useEffect(() => {
        // Only poll if user is authenticated
        if (!isAuthenticated()) {
            return;
        }

        if (isOpen) {
            loadMessages(); // Load immediately when opened

            const interval = setInterval(() => {
                if (isAuthenticated()) {
                    loadMessages();
                }
            }, 5000); // Poll every 5 seconds

            setPollingInterval(interval);

            return () => {
                clearInterval(interval);
                setPollingInterval(null);
            };
        } else {
            // Poll less frequently when closed (only for unread count)
            const interval = setInterval(() => {
                if (isAuthenticated()) {
                    loadMessages();
                }
            }, 15000); // Poll every 15 seconds

            setPollingInterval(interval);

            return () => {
                clearInterval(interval);
            };
        }
    }, [isOpen, loadMessages, isAuthenticated]);

    // Initial load - only if authenticated
    useEffect(() => {
        if (isAuthenticated()) {
            loadMessages();
        }
    }, [isAuthenticated, loadMessages]);

    const value: SupportChatContextType = {
        isOpen,
        messages,
        sessionId,
        unreadCount,
        isLoading,
        isTyping,
        openChat,
        closeChat,
        sendMessage,
        loadMessages,
        markAsRead,
    };

    return (
        <SupportChatContext.Provider value={value}>
            {children}
        </SupportChatContext.Provider>
    );
}

export function useSupportChat() {
    const context = useContext(SupportChatContext);
    if (context === undefined) {
        throw new Error('useSupportChat must be used within SupportChatProvider');
    }
    return context;
}
