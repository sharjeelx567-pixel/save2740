"use client"

import { ProtectedPage } from "@/components/protected-page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { Bell, Check, Clock, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"

interface Notification {
    _id: string
    title: string
    message: string
    type: string
    read: boolean
    isCritical?: boolean
    acknowledgedAt?: string
    createdAt: string
}

function NotificationsPageContent() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const response = await apiClient.get<any>('/api/notifications')
            if (response.success && response.data) {
                const notifs = response.data.notifications || response.data.items || []
                setNotifications(notifs)
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const markAsRead = async (id: string, notification: Notification) => {
        // Critical notifications require acknowledgment first
        if (notification.isCritical && !notification.acknowledgedAt) {
            if (confirm('This is a critical security alert. Click OK to acknowledge that you have read and understood this notification.')) {
                try {
                    await apiClient.post(`/api/notifications/${id}/acknowledge`, {})
                    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true, acknowledgedAt: new Date().toISOString() } : n))
                } catch (error) {
                    console.error("Failed to acknowledge critical notification")
                }
            }
            return
        }
        
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
            await apiClient.put(`/api/notifications/${id}/read`, {})
        } catch (error) {
            console.error("Failed to mark as read")
            // Revert optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: notification.read } : n))
        }
    }

    const markAllAsRead = async () => {
        try {
            // Only mark non-critical as read
            const nonCriticalIds = notifications.filter(n => !n.isCritical && !n.read).map(n => n._id)
            setNotifications(prev => prev.map(n => !n.isCritical ? { ...n, read: true } : n))
            await apiClient.post(`/api/notifications/mark-all-read`, {})
        } catch (error) {
            console.error("Failed to mark all as read")
        }
    }

    const getIcon = (type: string, isCritical: boolean = false) => {
        if (isCritical) {
            return <div className="p-2 bg-red-100 rounded-full"><Bell className="w-5 h-5 text-red-600" /></div>
        }
        switch (type) {
            case 'success': return <div className="p-2 bg-green-100 rounded-full"><Check className="w-5 h-5 text-green-600" /></div>
            case 'payment_success': return <div className="p-2 bg-green-100 rounded-full"><Check className="w-5 h-5 text-green-600" /></div>
            case 'warning': return <div className="p-2 bg-amber-100 rounded-full"><Bell className="w-5 h-5 text-amber-600" /></div>
            case 'alert': return <div className="p-2 bg-red-100 rounded-full"><Bell className="w-5 h-5 text-red-600" /></div>
            case 'login_attempt': return <div className="p-2 bg-red-100 rounded-full"><Bell className="w-5 h-5 text-red-600" /></div>
            case 'password_changed': return <div className="p-2 bg-red-100 rounded-full"><Bell className="w-5 h-5 text-red-600" /></div>
            case 'security_alert': return <div className="p-2 bg-red-100 rounded-full"><Bell className="w-5 h-5 text-red-600" /></div>
            default: return <div className="p-2 bg-slate-100 rounded-full"><Bell className="w-5 h-5 text-slate-600" /></div>
        }
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-full">
                <Sidebar />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Notifications" onMenuClick={() => setIsSidebarOpen(true)} />

                <div className="flex-1 p-4 sm:p-6 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900">Your Notifications</h1>
                            {notifications.some(n => !n.read) && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-brand-green font-medium hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900">No notifications</h3>
                                    <p className="text-slate-500">You're all caught up!</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <Card
                                        key={notification._id}
                                        className={`transition-colors cursor-pointer ${
                                            notification.isCritical 
                                                ? 'bg-red-50 border-l-4 border-l-red-600 shadow-md' 
                                                : !notification.read 
                                                    ? 'bg-white border-l-4 border-l-brand-green shadow-sm' 
                                                    : 'bg-slate-50 border-slate-200 opacity-75'
                                        }`}
                                        onClick={() => !notification.read && markAsRead(notification._id, notification)}
                                    >
                                        <CardContent className="p-4 sm:p-6 flex gap-4">
                                            <div className="shrink-0 mt-1">
                                                {getIcon(notification.type, notification.isCritical || false)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className={`text-base font-semibold ${
                                                        notification.isCritical 
                                                            ? 'text-red-900' 
                                                            : !notification.read 
                                                                ? 'text-slate-900' 
                                                                : 'text-slate-700'
                                                    }`}>
                                                        {notification.isCritical && '\u26a0\ufe0f '}{notification.title}
                                                    </h3>
                                                    <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className={`mt-1 text-sm ${
                                                    notification.isCritical 
                                                        ? 'text-red-800 font-medium' 
                                                        : !notification.read 
                                                            ? 'text-slate-600' 
                                                            : 'text-slate-500'
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                {notification.isCritical && !notification.acknowledgedAt && (
                                                    <div className="mt-3 px-3 py-2 bg-red-100 border border-red-300 rounded-md text-xs text-red-800">
                                                        \ud83d\udd12 <strong>Critical Alert:</strong> Click to acknowledge
                                                    </div>
                                                )}
                                            </div>
                                            {!notification.read && !notification.isCritical && (
                                                <div className="shrink-0 flex items-center">
                                                    <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                                                </div>
                                            )}
                                            {notification.isCritical && !notification.acknowledgedAt && (
                                                <div className="shrink-0 flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function NotificationsPage() {
    return (
        <ProtectedPage>
            <NotificationsPageContent />
        </ProtectedPage>
    )
}

