"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, X, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        name: "Sarah (Support)",
        message: "Hi! How can I help you today?",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
];

export function SupportChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputMessage, setInputMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!inputMessage.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            name: "You",
            message: inputMessage,
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages([...messages, userMessage]);
        setInputMessage("");
        setIsTyping(true);

        // Simulate agent response
        setTimeout(() => {
            const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "agent",
                name: "Sarah (Support)",
                message: "Thanks for reaching out! I'm looking into that for you.",
                timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, agentMessage]);
            setIsTyping(false);
        }, 2000);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-xl transition-all duration-300 ${isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-brand-green hover:bg-emerald-600 rotate-0"
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[90vw] sm:w-[380px] h-[500px] max-h-[70vh] animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <Card className="h-full flex flex-col border-0 shadow-2xl overflow-hidden rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green font-bold">
                                            S
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div>
                                        <CardTitle className="text-white text-base">Support Chat</CardTitle>
                                        <p className="text-emerald-100 text-xs">Sarah is online</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 h-8 w-8"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Minus className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[80%] ${msg.sender === "user" ? "order-2" : "order-1"}`}>
                                        <div
                                            className={`rounded-2xl px-3 py-2 text-sm ${msg.sender === "user"
                                                    ? "bg-brand-green text-white rounded-tr-none"
                                                    : "bg-white text-slate-800 shadow-sm rounded-tl-none border border-slate-100"
                                                }`}
                                        >
                                            <p>{msg.message}</p>
                                        </div>
                                        <p className={`text-[10px] mt-1 px-1 ${msg.sender === "user" ? "text-right text-slate-400" : "text-left text-slate-400"
                                            }`}>
                                            {msg.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>

                        <div className="p-3 bg-white border-t border-slate-100">
                            <div className="flex gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 text-sm focus-visible:ring-brand-green"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputMessage.trim()}
                                    size="icon"
                                    className="bg-brand-green hover:bg-emerald-600 shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
