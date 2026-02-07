"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, X, Minus, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useSupportChat } from "@/context/support-chat-context";
import { chatService, ChatMessage } from "@/lib/services/chat.service";
import { apiClient } from "@/lib/api-client";

export function SupportChatWidget() {
    const { user, isAuthenticated } = useAuth();
    const { isOpen, closeChat, openChat } = useSupportChat();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Robust authentication check with fallback
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

    useEffect(() => {
        // Check both auth context and localStorage for robustness
        const checkAuthStatus = () => {
            const hasStoredSession = typeof window !== 'undefined' && localStorage.getItem('session');
            const hasStoredUser = typeof window !== 'undefined' && localStorage.getItem('user');
            const isLoggedIn = isAuthenticated || (hasStoredSession && hasStoredUser);
            setIsUserLoggedIn(!!isLoggedIn);
        };

        checkAuthStatus();
        // Re-check periodically in case auth state changes
        const interval = setInterval(checkAuthStatus, 1000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Listen for external open signals (e.g. from header notification)
    useEffect(() => {
        const handleOpenSignal = () => {
            if (!isOpen) {
                openChat();
            }
        };

        window.addEventListener('open-chat', handleOpenSignal);
        return () => window.removeEventListener('open-chat', handleOpenSignal);
    }, [isOpen, openChat]);

    // Load chat messages when opened
    useEffect(() => {
        if (isOpen && isUserLoggedIn && user?.id) {
            setMessages([]); // FORCE CLEAR ON ID CHANGE
            setIsLoading(true);

            // Subscribe to real-time messages
            unsubscribeRef.current = chatService.subscribeToMessages(
                user.id,
                (newMessages) => {
                    // Direct replacement of messages array with full history
                    setMessages(newMessages);

                    // Handle notification sound for new admin messages
                    if (newMessages.length > 0) {
                        const lastMsg = newMessages[newMessages.length - 1];
                        const now = new Date();
                        const msgTime = new Date(lastMsg.timestamp);

                        // If message is from admin and recent (< 5s), notify
                        if (lastMsg.senderType === 'admin' && (now.getTime() - msgTime.getTime() < 5000)) {
                            window.dispatchEvent(new CustomEvent('open-chat', { detail: lastMsg }));
                        }
                    }

                    setIsLoading(false);
                    // Scroll happens in useEffect
                }
            );

            // Cleanup subscription on unmount or when chat closes
            return () => {
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }
                setMessages([]); // Clear messages to prevent leak to next session
            };
        } else if (isOpen && !isUserLoggedIn) {
            // User is not logged in, show message
            setIsLoading(false);
            setMessages([]); // Ensure clear
        }
    }, [isOpen, isAuthenticated, user?.id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!inputMessage.trim() || !user?.id || isSending) return;

        const messageText = inputMessage.trim();
        setInputMessage("");
        setIsSending(true);

        try {
            // Send message to Firestore
            const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
            await chatService.sendMessage(user.id, messageText);

            // Notify admins via backend FCM
            try {
                await apiClient.post('/api/chat-notification/user-message', {
                    message: messageText,
                    userName,
                });
            } catch (notifError) {
                console.warn('Failed to send admin notification:', notifError);
                // Don't show error to user - message was still sent
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Restore the message in input on error
            setInputMessage(messageText);
        } finally {
            setIsSending(false);
        }
    };

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

    return (
        <>
            {/* Chat Window - responsive, no horizontal scroll */}
            {isOpen && (
                <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] w-full max-w-full min-w-0 animate-in slide-in-from-bottom-10 fade-in duration-200 sm:inset-x-auto sm:right-4 sm:bottom-6 sm:left-auto sm:w-[min(380px,calc(100vw-2rem))] sm:max-h-[min(560px,85vh)] sm:h-[min(560px,85vh)]">
                    <Card className="h-full min-h-0 flex flex-col border-0 shadow-2xl overflow-hidden overflow-x-hidden rounded-t-2xl sm:rounded-2xl min-w-0">
                        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 sm:p-4 shrink-0">
                            <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green font-bold">
                                            S
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-white text-sm sm:text-base truncate">Support Chat</CardTitle>
                                        <p className="text-emerald-100 text-xs">Sarah is online</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 h-8 w-8"
                                    onClick={closeChat}
                                >
                                    <Minus className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 bg-slate-50 flex flex-col gap-4">
                            {!isUserLoggedIn ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400 px-4">
                                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                                    <p className="text-sm text-center">Please log in to chat with support</p>
                                    <button
                                        onClick={() => window.location.href = '/auth/login'}
                                        className="mt-3 px-4 py-2 bg-brand-green text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                                    >
                                        Log In
                                    </button>
                                </div>
                            ) : isLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                                    <p className="text-sm">Start a conversation with support</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex min-w-0 ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`min-w-0 max-w-[85%] ${msg.senderType === "user" ? "order-2" : "order-1"}`}>
                                            <div
                                                className={`rounded-2xl px-3 py-2 text-sm break-words ${msg.senderType === "user"
                                                    ? "bg-brand-green text-white rounded-tr-none"
                                                    : "bg-white text-slate-800 shadow-sm rounded-tl-none border border-slate-100"
                                                    }`}
                                            >
                                                <p className="break-words">{msg.message}</p>
                                            </div>
                                            <p className={`text-[10px] mt-1 px-1 ${msg.senderType === "user" ? "text-right text-slate-400" : "text-left text-slate-400"
                                                }`}>
                                                {msg.senderName && msg.senderType === "admin" && (
                                                    <span className="font-medium">{msg.senderName} • </span>
                                                )}
                                                {msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>

                        <div className="p-3 bg-white border-t border-slate-100 shrink-0 min-w-0">
                            <div className="flex gap-2 min-w-0">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && !isSending && isUserLoggedIn && handleSend()}
                                    placeholder={isUserLoggedIn ? "Type a message..." : "Please log in to chat"}
                                    className="flex-1 min-w-0 text-sm focus-visible:ring-brand-green"
                                    disabled={isSending || !isUserLoggedIn}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputMessage.trim() || isSending || !isUserLoggedIn}
                                    size="icon"
                                    className="bg-brand-green hover:bg-emerald-600 shrink-0"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}

