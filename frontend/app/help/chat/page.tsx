"use client";

import { ProtectedPage } from "@/components/protected-page";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { chatService } from "@/lib/services/chat.service";

interface Message {
    id: string;
    sender: "user" | "agent";
    name: string;
    message: string;
    timestamp: string;
}

const initialMessages: Message[] = [
    {
        id: "1",
        sender: "agent",
        name: "Sarah (Support Agent)",
        message: "Hi there! Welcome to Save2740 support. How can I help you today?",
        timestamp: "10:30 AM",
    },
];

function LiveChatContent() {
    const { user } = useAuth() as any;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load messages and subscribe
    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = chatService.subscribeToMessages(user.id, (newMessages) => {
            const formattedMessages: Message[] = newMessages.map(msg => ({
                id: msg.id,
                sender: msg.senderType === 'admin' ? 'agent' : 'user',
                name: msg.senderName || (msg.senderType === 'admin' ? 'Support' : 'You'),
                message: msg.message,
                timestamp: msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString(),
            }));
            setMessages(formattedMessages);
            scrollToBottom();
        });

        // Mark as read when opening
        chatService.markAsRead(user.id);

        return () => unsubscribe();
    }, [user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputMessage.trim() || !user) return;

        try {
            setLoading(true);
            const messageText = inputMessage;
            setInputMessage("");

            await chatService.sendMessage(
                user.id,
                messageText,
                `${user.firstName} ${user.lastName}`
            );
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block h-full">
                <Sidebar />
            </div>

            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="flex-1 overflow-hidden flex flex-col">
                <DashboardHeader title="Live Chat" onMenuClick={() => setIsSidebarOpen(true)} />

                <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-hidden">
                    <div className="max-w-4xl mx-auto h-full flex flex-col">
                        <Card className="border-0 shadow-xl flex-1 flex flex-col overflow-hidden">
                            {/* Chat Header */}
                            <CardHeader className="border-b bg-gradient-to-r from-emerald-500 to-teal-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-white">Live Support Chat</CardTitle>
                                        <p className="text-emerald-100 text-sm mt-1">
                                            <span className="inline-block w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
                                            Sarah is online
                                        </p>
                                    </div>
                                    <Badge className="bg-white/20 text-white border-white/30">Active</Badge>
                                </div>
                            </CardHeader>

                            {/* Messages Area */}
                            <CardContent className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[70%] ${msg.sender === "user" ? "order-2" : "order-1"}`}>
                                                <p className="text-xs text-gray-600 mb-1 px-1">{msg.name}</p>
                                                <div
                                                    className={`rounded-2xl px-4 py-3 ${msg.sender === "user"
                                                        ? "bg-brand-green text-white rounded-tr-none"
                                                        : "bg-white text-gray-900 shadow-sm rounded-tl-none"
                                                        }`}
                                                >
                                                    <p>{msg.message}</p>
                                                    <p
                                                        className={`text-xs mt-1 ${msg.sender === "user" ? "text-emerald-100" : "text-gray-500"
                                                            }`}
                                                    >
                                                        {msg.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div ref={messagesEndRef} />

                                </div>
                            </CardContent>

                            {/* Input Area */}
                            <div className="border-t p-4 bg-white">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <Paperclip className="w-5 h-5" />
                                    </Button>
                                    <Input
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                        placeholder="Type your message..."
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!inputMessage.trim()}
                                        className="bg-brand-green hover:bg-brand-green/90 gap-2 shrink-0"
                                    >
                                        <Send className="w-5 h-5" />
                                        Send
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Average response time: Under 2 minutes</p>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Quick Actions:</p>
                            <div className="flex flex-wrap gap-2">
                                {["Check my balance", "Reset password", "Report a problem", "Account verification"].map((action) => (
                                    <Button
                                        key={action}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setInputMessage(action)}
                                        className="text-sm"
                                    >
                                        {action}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function LiveChatPage() {
    return (
        <ProtectedPage>
            <LiveChatContent />
        </ProtectedPage>
    );
}

