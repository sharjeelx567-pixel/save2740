"use client"

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, CheckCircle, Loader2, User, Clock, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ChatMessageBubble } from '@/components/chat-message-bubble';

interface ChatSession {
    _id: string;
    userId: string;
    status: 'active' | 'resolved';
    lastMessageAt: string;
    createdAt: string;
    userEmail?: string;
    userName?: string;
    unreadCount: number;
    lastMessage: string;
    lastMessageTime: string;
}

interface ChatMessage {
    _id: string;
    sessionId: string;
    sender: 'user' | 'admin';
    message: string;
    read: boolean;
    createdAt: string;
}

export default function AdminSupportChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'active' | 'resolved' | 'all'>('active');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch sessions
    const fetchSessions = async () => {
        try {
            const response = await fetch(`/api/support-chat/sessions?status=${statusFilter}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSessions(data.data.sessions || []);
                }
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    // Fetch messages for a session
    const fetchMessages = async (sessionId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/support-chat/messages?sessionId=${sessionId}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setMessages(data.data.messages || []);
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Send message as admin
    const sendMessage = async () => {
        if (!inputValue.trim() || !selectedSession || isSending) return;

        setIsSending(true);
        try {
            const response = await fetch('/api/support-chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    sessionId: selectedSession._id,
                    message: inputValue,
                    sender: 'admin',
                }),
            });

            if (response.ok) {
                setInputValue('');
                await fetchMessages(selectedSession._id);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Resolve session
    const resolveSession = async (sessionId: string) => {
        try {
            const response = await fetch('/api/support-chat/resolve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ sessionId }),
            });

            if (response.ok) {
                setSelectedSession(null);
                fetchSessions();
            }
        } catch (error) {
            console.error('Error resolving session:', error);
        }
    };

    // Load sessions on mount and when filter changes
    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [statusFilter]);

    // Load messages when session is selected
    useEffect(() => {
        if (selectedSession) {
            fetchMessages(selectedSession._id);
            const interval = setInterval(() => {
                fetchMessages(selectedSession._id);
            }, 5000); // Poll every 5 seconds
            return () => clearInterval(interval);
        }
    }, [selectedSession]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Support Chat Dashboard</h1>
                    <p className="text-slate-600">Manage customer support conversations</p>
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sessions list */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4">
                        {/* Filter tabs */}
                        <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setStatusFilter('active')}
                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${statusFilter === 'active'
                                        ? 'bg-white text-brand-green shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setStatusFilter('resolved')}
                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${statusFilter === 'resolved'
                                        ? 'bg-white text-brand-green shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                Resolved
                            </button>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${statusFilter === 'all'
                                        ? 'bg-white text-brand-green shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                All
                            </button>
                        </div>

                        {/* Sessions */}
                        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {sessions.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500">No {statusFilter !== 'all' && statusFilter} sessions</p>
                                </div>
                            ) : (
                                sessions.map((session) => (
                                    <button
                                        key={session._id}
                                        onClick={() => setSelectedSession(session)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedSession?._id === session._id
                                                ? 'border-brand-green bg-emerald-50'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">
                                                        {session.userName || session.userEmail || 'User'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{session.userEmail}</p>
                                                </div>
                                            </div>
                                            {session.unreadCount > 0 && (
                                                <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                    {session.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 truncate mb-1">{session.lastMessage}</p>
                                        <p className="text-xs text-slate-400">
                                            {format(new Date(session.lastMessageTime), 'MMM d, h:mm a')}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat window */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: '700px' }}>
                        {selectedSession ? (
                            <>
                                {/* Chat header */}
                                <div className="bg-gradient-to-r from-brand-green to-emerald-600 text-white p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{selectedSession.userName || 'User'}</h3>
                                            <p className="text-xs text-white/80">{selectedSession.userEmail}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedSession.status === 'active' && (
                                            <button
                                                onClick={() => resolveSession(selectedSession._id)}
                                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-all text-sm"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Mark as Resolved</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedSession(null)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {messages.map((msg) => (
                                                <ChatMessageBubble
                                                    key={msg._id}
                                                    sender={msg.sender}
                                                    message={msg.message}
                                                    createdAt={msg.createdAt}
                                                    read={msg.read}
                                                />
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <div className="p-4 bg-white border-t border-slate-200">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') sendMessage();
                                            }}
                                            placeholder="Type your reply..."
                                            disabled={isSending || selectedSession.status === 'resolved'}
                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all disabled:opacity-50"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!inputValue.trim() || isSending || selectedSession.status === 'resolved'}
                                            className="flex-shrink-0 w-10 h-10 bg-brand-green hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No chat selected</h3>
                                    <p className="text-slate-600">Select a conversation from the list to start chatting</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
