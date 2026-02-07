"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Send, User, Search, Phone, Video, MoreVertical, Paperclip, Smile, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { adminChatService, ChatMessage, ChatUser } from "@/lib/services/chat.service";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface ChatSession {
    userId: string;
    userName: string;
    userEmail: string;
    avatar: string;
    profileImageUrl: string | null;
    lastMessage: string;
    lastMessageTime: Date;
    unread: number;
}

function LiveChatContent() {
    const { user: adminUser } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
    const unsubscribeSessionsRef = useRef<(() => void) | null>(null);

    // Refs for Data Consistency Strategy
    const userMapRef = useRef<Record<string, ChatUser>>({});
    const latestFirestoreSessionsRef = useRef<any[]>([]);
    const pendingUserFetchesRef = useRef<Set<string>>(new Set());

    const activeSession = sessions.find((s) => s.userId === activeUserId);

    // Helper to merge data and update state
    const refreshSessionsList = () => {
        const firestoreSessions = latestFirestoreSessionsRef.current;
        const userMap = userMapRef.current;

        const convertedSessions: ChatSession[] = firestoreSessions.map((session: any) => {
            const userDetail = userMap[session.userId];

            // Resolve Name Dynamically
            let userName = 'Unknown User';
            let userEmail = '';

            if (userDetail) {
                userName = `${userDetail.firstName} ${userDetail.lastName}`.trim() || userDetail.email;
                userEmail = userDetail.email;
            }
            const profileImageUrl = userDetail?.profileImage
                ? (userDetail.profileImage.startsWith('http') ? userDetail.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${userDetail.profileImage.startsWith('/') ? '' : '/'}${userDetail.profileImage}`)
                : null;

            if (!userDetail) {
                // If missing and we haven't tried fetching, trigger fetch
                // We use "Loading..." or fallback name if we have one? 
                // Firestore might have stale "userName" we want to avoid showing, 
                // but "Loading..." is better than old stale data if we want strict consistency.
                // Or we can fall back to session.userName if valid temporarily? 
                // NO, STRICT CONSISTENCY RULE: "NEVER store username as source of truth".
                // We will show "Loading..." or generic.
                userName = 'User ' + session.userId.substring(0, 4);
                fetchMissingUser(session.userId);
            }

            // Ensure lastMessageTime is a Date object
            let lastMessageTime = new Date();
            if (session.lastMessageTime) {
                if (session.lastMessageTime instanceof Date) {
                    lastMessageTime = session.lastMessageTime;
                } else if (typeof session.lastMessageTime === 'string') {
                    lastMessageTime = new Date(session.lastMessageTime);
                } else if (session.lastMessageTime.toDate) {
                    lastMessageTime = session.lastMessageTime.toDate();
                }
            }

            return {
                userId: session.userId,
                userName,
                userEmail,
                avatar: getAvatarColor(session.userId),
                profileImageUrl: profileImageUrl || null,
                lastMessage: session.lastMessage || '',
                lastMessageTime,
                unread: session.unreadCount || 0,
            };
        });

        setSessions(convertedSessions);
    };

    const fetchMissingUser = async (userId: string) => {
        if (pendingUserFetchesRef.current.has(userId)) return;
        pendingUserFetchesRef.current.add(userId);

        try {
            const data = await adminChatService.getUserContext(userId);
            if (data && data.user) {
                userMapRef.current[userId] = data.user;
                refreshSessionsList(); // Re-render with new data
            }
        } catch (err) {
            console.error("Error fetching user context", err);
        } finally {
            pendingUserFetchesRef.current.delete(userId);
        }
    };

    // Load initial data
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch backend users map
                const chatUsers = await adminChatService.getChatUsers();
                chatUsers.forEach(u => {
                    userMapRef.current[u.userId] = u;
                });
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }

            // 2. Subscribe to Firestore (Real-time Source of Truth for Sessions)
            unsubscribeSessionsRef.current = adminChatService.subscribeToAllSessions((firestoreSessions) => {
                latestFirestoreSessionsRef.current = firestoreSessions;
                refreshSessionsList();
            });
        };

        init();

        // Deep linking handling
        const userIdParam = searchParams.get('userId');
        if (userIdParam) {
            setActiveUserId(userIdParam);
            // Optionally fetch user context immediately if not in map
            if (!userMapRef.current[userIdParam]) {
                fetchMissingUser(userIdParam);
            }
        }

        return () => {
            if (unsubscribeSessionsRef.current) {
                unsubscribeSessionsRef.current();
            }
        };
    }, [searchParams]); // Add searchParams dependency

    // Subscribe to messages when a chat is selected
    useEffect(() => {
        if (activeUserId) {
            // Clear previous messages immediately to avoid showing wrong chat
            setMessages([]);
            setIsLoading(true);

            // Unsubscribe from previous chat
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
            }

            // Subscribe to new chat
            unsubscribeMessagesRef.current = adminChatService.subscribeToMessages(
                activeUserId,
                (newMessages) => {
                    // Update messages state with the full array from Firestore
                    setMessages(newMessages);

                    // Check if we need to play sound (if count increased)
                    // We use a ref or check the previous length in a separate effect if needed, 
                    // but here we can just check against the previous state using a functional update wrapper if we strictly wanted to,
                    // or just play sound if the last message is from user and very recent.
                    if (newMessages.length > 0) {
                        const lastMsg = newMessages[newMessages.length - 1];
                        const now = new Date();
                        const msgTime = new Date(lastMsg.timestamp);
                        // Only notify if message is from user and less than 5 seconds old
                        if (lastMsg.senderType === 'user' && (now.getTime() - msgTime.getTime() < 5000)) {
                            window.dispatchEvent(new CustomEvent('admin-new-message', { detail: lastMsg }));
                        }
                    }

                    setIsLoading(false);
                }
            );
        }

        return () => {
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
                unsubscribeMessagesRef.current = null;
            }
        };
    }, [activeUserId]);

    // Auto-scroll when messages change
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const formatMessageTime = (timestamp: any): string => {
        try {
            // Handle different timestamp formats
            let date: Date;

            if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else if (timestamp?.toDate) {
                // Firestore Timestamp
                date = timestamp.toDate();
            } else {
                return 'Just now';
            }

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Just now';
            }

            return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Just now';
        }
    };



    const getAvatarColor = (userId: string): string => {
        const colors = [
            'bg-purple-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-indigo-500',
            'bg-pink-500',
            'bg-teal-500',
        ];
        const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    // Sound Effect
    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // First tone (higher pitch)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(800, now);
            gain1.gain.setValueAtTime(0.1, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc1.start(now);
            osc1.stop(now + 0.1);

            // Second tone (slightly lower, warmer)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(600, now + 0.1);
            gain2.gain.setValueAtTime(0.1, now + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.4);
        } catch (error) {
            console.error("Error playing notification sound:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !activeUserId || !adminUser?.id || isSending) return;

        const messageText = inputMessage.trim();
        setInputMessage("");
        setIsSending(true);

        try {
            // Send message to Firestore
            const adminName = adminUser.name || 'Support';
            await adminChatService.sendMessage(
                activeUserId,
                messageText,
                adminUser.id,
                adminName
            );

            // Notify user via backend FCM
            try {
                await api.post('/api/chat-notification/admin-reply', {
                    userId: activeUserId,
                    message: messageText,
                    adminName,
                });
            } catch (notifError) {
                console.warn('Failed to send user notification:', notifError);
                // Don't show error to admin - message was still sent
            }

            // Play success sound - REMOVED to prevent self-echo
            // playNotificationSound();
        } catch (error) {
            console.error('Failed to send message:', error);
            // Restore the message in input on error
            setInputMessage(messageText);
        } finally {
            setIsSending(false);
        }
    };

    const filteredSessions = sessions.filter((session) =>
        session.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <PageHeader
                title="Live Support Chat"
                description="Real-time communication with users"
                action={<Button variant="outline">Settings</Button>}
            />

            <div className="flex h-[calc(100vh-12rem)] gap-4 mt-4">
                {/* Chat List (Sidebar) */}
                <Card className="w-1/3 flex flex-col overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search chats..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">No active chats</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredSessions.map((session) => (
                                    <button
                                        key={session.userId}
                                        onClick={() => setActiveUserId(session.userId)}
                                        className={cn(
                                            "flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                                            activeUserId === session.userId && "bg-muted"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0", session.avatar)}>
                                            {session.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{session.userName}</span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatMessageTime(session.lastMessageTime)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{session.lastMessage}</p>
                                        </div>
                                        {session.unread > 0 && (
                                            <Badge variant="danger" className="rounded-full px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                                                {session.unread}
                                            </Badge>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Chat Window */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {activeSession ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between p-4 border-b shrink-0 bg-card">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold", activeSession.avatar)}>
                                        {activeSession.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{activeSession.userName}</h3>
                                        <p className="text-xs text-muted-foreground">{activeSession.userEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" className="p-2"><MoreVertical className="h-4 w-4" /></Button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                                <div className="flex flex-col gap-4">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                            <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                                            <p className="text-sm">No messages yet</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex max-w-[70%]",
                                                    msg.senderType === "admin" ? "ml-auto" : "mr-auto"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "rounded-2xl px-4 py-2 text-sm shadow-sm",
                                                        msg.senderType === "admin"
                                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                                            : "bg-white border border-slate-100 rounded-bl-none"
                                                    )}
                                                >
                                                    <p>{msg.message}</p>
                                                    <p className={cn("text-[10px] mt-1 text-right", msg.senderType === 'admin' ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                        {msg.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t bg-card shrink-0">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={inputMessage}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                                            e.key === 'Enter' && !isSending && handleSendMessage()
                                        }
                                        placeholder="Type a message..."
                                        className="flex-1"
                                        disabled={isSending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isSending}
                                        className="shrink-0"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                            <p>Select a chat to start messaging</p>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}

export default function LiveChatPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
        }>
            <LiveChatContent />
        </Suspense>
    );
}
