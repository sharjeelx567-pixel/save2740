"use client"

import { format } from 'date-fns';
import { User, Headphones } from 'lucide-react';

interface ChatMessageBubbleProps {
    sender: 'user' | 'admin';
    message: string;
    createdAt: string;
    read?: boolean;
}

export function ChatMessageBubble({ sender, message, createdAt, read }: ChatMessageBubbleProps) {
    const isUser = sender === 'user';
    const formattedTime = format(new Date(createdAt), 'h:mm a');

    return (
        <div
            className={`flex gap-2 mb-4 animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'
                }`}
        >
            {/* Admin avatar */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center shadow-md">
                    <Headphones className="w-4 h-4 text-white" />
                </div>
            )}

            {/* Message bubble */}
            <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${isUser
                            ? 'bg-brand-green text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}
                >
                    <p className="text-sm leading-relaxed break-words">{message}</p>
                </div>

                {/* Timestamp */}
                <div className="mt-1 px-1 flex items-center gap-1">
                    <span className="text-xs text-slate-400">{formattedTime}</span>
                    {isUser && read !== undefined && (
                        <span className="text-xs text-slate-400">
                            {read ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
            </div>

            {/* User avatar */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-md">
                    <User className="w-4 h-4 text-white" />
                </div>
            )}
        </div>
    );
}

