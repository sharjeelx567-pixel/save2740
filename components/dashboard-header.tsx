"use client"

import { useState, useEffect } from "react"
import { Bell, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface DashboardHeaderProps {
  title?: string
  onMenuClick?: () => void
  showMobileTitle?: boolean
}

interface Notification {
  _id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  type?: string
}

export function DashboardHeader({ title = "Dashboard", onMenuClick, showMobileTitle = true }: DashboardHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.data.notifications || [])
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <div className="bg-white w-full border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 sm:px-5 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6">
          <div className="flex items-center justify-between w-full gap-2 sm:gap-3 md:gap-4">
            {/* Left side - Menu and Title */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
              <button onClick={onMenuClick} className="lg:hidden p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 text-slate-600 shrink-0 rounded transition-colors">
                <Menu className="w-5 h-5 sm:w-5 md:w-6 h-5 md:h-6" />
              </button>
              <h1 className="hidden lg:block text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-slate-800 truncate">{title}</h1>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              {/* Auto-save / Manual Toggle */}
              <div className="bg-slate-50 rounded-full p-0.5 sm:p-1 flex items-center shadow-sm border border-slate-200 shrink-0">
                <button className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-xs md:text-sm font-medium bg-white text-brand-green whitespace-nowrap transition-colors shadow-sm">
                  Auto-save
                </button>
                <button className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-xs md:text-sm font-medium text-slate-500 whitespace-nowrap transition-colors">
                  Manual
                </button>
              </div>

              {/* Bell Icon - Now Functional */}
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative bg-slate-50 p-2 sm:p-2 md:p-2.5 rounded-full shadow-sm hover:bg-slate-100 border border-slate-200 transition-colors flex-shrink-0"
              >
                <Bell className="w-5 h-5 sm:w-5 md:w-6 text-slate-600" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white px-0.5">{unreadCount}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Page Title - Visible below header on mobile */}
      {showMobileTitle && (
        <div className="lg:hidden px-4 sm:px-5 pb-2 pt-4 bg-[#F8FAFC]">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>
      )}

      {/* Notifications Panel */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <SheetHeader className="p-6 border-b border-slate-200">
            <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No notifications yet</p>
                <p className="text-slate-400 text-sm mt-1">We'll notify you when something important happens</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.read ? 'bg-emerald-50/50' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notification.read ? 'bg-brand-green' : 'bg-slate-300'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-200">
              <button className="w-full py-2 text-sm font-semibold text-brand-green hover:text-emerald-700 transition-colors">
                Mark all as read
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
