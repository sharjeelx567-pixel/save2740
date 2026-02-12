'use client'

import { useState } from 'react'
import { Search, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AdminNotificationPanel from '@/components/notifications/AdminNotificationPanel'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick?: () => void;
  isCollapsed?: boolean;
}

export default function Header({ onMenuClick, isCollapsed = false }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { user, logout } = useAuth()



  return (
    <header className={cn(
      "h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 transition-all duration-300 ease-in-out min-w-0 w-full"
    )}>
      {/* Hamburger Menu - Mobile Only */}
      <button
        onClick={onMenuClick}
        className="p-2.5 min-h-[44px] min-w-[44px] md:hidden hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation flex-shrink-0 flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Search - hide on very small to avoid cramping */}
      <div className="flex-1 min-w-0 max-w-2xl hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users, transactions, tickets..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4 ml-2 sm:ml-6 flex-shrink-0">

        {/* Notifications */}
        <AdminNotificationPanel />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
            aria-label="Admin menu"
          >
            <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Administrator'}</p>
            </div>
          </button>

          {/* Dropdown - Logout Only */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
