"use client"

import { useState, useRef, useEffect } from 'react';
import { X, Minus, Send, Loader2, MessageCircle } from 'lucide-react';
import { useSupportChat } from '@/context/support-chat-context';
import { ChatMessageBubble } from './chat-message-bubble';
import { TypingIndicator } from './typing-indicator';

export function SupportChatWidget() {
    const {
        isOpen,
        closeChat,
        messages,
        sendMessage,
        isLoading,
        isTyping,
    } = useSupportChat();

    const [inputValue, setInputValue] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const messageText = inputValue;
        setInputValue('');
        await sendMessage(messageText);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={closeChat}
            />

            {/* Chat widget */}
            <div
                className={`fixed z-50 bg-white shadow-2xl transition-all duration-300 ${isMinimized
                        ? 'bottom-6 right-6 w-80 h-16'
                        : 'bottom-0 right-0 lg:bottom-6 lg:right-6 w-full h-full lg:w-96 lg:h-[600px] lg:rounded-2xl'
                    } animate-fade-in-up overflow-hidden`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-green to-emerald-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">Support Chat</h3>
                            <p className="text-xs text-white/80">We're here to help!</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Minimize button */}
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="hidden lg:block p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Minimize chat"
                        >
                            <Minus className="w-5 h-5" />
                        </button>

                        {/* Close button */}
                        <button
                            onClick={closeChat}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Chat content - hidden when minimized */}
                {!isMinimized && (
                    <>
                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 h-[calc(100%-140px)] lg:h-[calc(100%-140px)] custom-scrollbar">
                            {messages.length === 0 ? (
                                // Empty state
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mb-4">
                                        <MessageCircle className="w-8 h-8 text-brand-green" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-800 mb-2">
                                        Start a conversation
                                    </h4>
                                    <p className="text-sm text-slate-600 max-w-xs">
                                        Have a question or need help? Send us a message and we'll get back to you as soon as possible!
                                    </p>
                                </div>
                            ) : (
                                // Messages list
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

                                    {/* Typing indicator */}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <TypingIndicator />
                                        </div>
                                    )}

                                    {/* Auto-scroll anchor */}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input area */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all disabled:opacity-50"
                                />

                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="flex-shrink-0 w-10 h-10 bg-brand-green hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                    aria-label="Send message"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Powered by notice */}
                            <p className="text-xs text-slate-400 text-center mt-2">
                                Powered by Save2740 Support
                            </p>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
