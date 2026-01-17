"use client"

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useSupportChat } from '@/context/support-chat-context';

export function SupportChatButton() {
    const { openChat, unreadCount } = useSupportChat();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is authenticated
    useEffect(() => {
        const checkAuth = () => {
            if (typeof window === 'undefined') return false;
            
            const session = localStorage.getItem('session');
            const user = localStorage.getItem('user');
            
            if (session && user) {
                try {
                    const sessionData = JSON.parse(session);
                    if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
                        setIsAuthenticated(true);
                        return;
                    }
                } catch (e) {
                    // Invalid session
                }
            }
            setIsAuthenticated(false);
        };

        checkAuth();
        // Check periodically
        const interval = setInterval(checkAuth, 5000);
        return () => clearInterval(interval);
    }, []);

    // Don't show button if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <button
            onClick={openChat}
            className="fixed bottom-6 right-6 z-50 bg-brand-green hover:bg-emerald-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
            aria-label="Open support chat"
        >
            {/* Pulse animation ring */}
            <div className="absolute inset-0 rounded-full bg-brand-green opacity-75 animate-ping-slow"></div>

            {/* Icon */}
            <MessageCircle className="w-6 h-6 relative z-10" />

            {/* Unread badge */}
            {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-bounce-slow">
                    <span className="text-xs font-bold text-white px-1">{unreadCount}</span>
                </div>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Need help? Chat with us!
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
            </div>
        </button>
    );
}
