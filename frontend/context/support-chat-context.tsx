"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SupportChatContextType {
    isOpen: boolean;
    unreadCount: number;
    openChat: () => void;
    closeChat: () => void;
    setUnreadCount: (count: number) => void;
}

const SupportChatContext = createContext<SupportChatContextType | undefined>(undefined);

export function SupportChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);

    return (
        <SupportChatContext.Provider value={{
            isOpen,
            unreadCount,
            openChat,
            closeChat,
            setUnreadCount
        }}>
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
