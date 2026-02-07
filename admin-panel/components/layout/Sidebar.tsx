'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'KYC Requests', href: '/kyc', icon: FileText },
  { name: 'Support Tickets', href: '/support', icon: MessageSquare },
  { name: 'Live Chat', href: '/support/live-chat', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Audit Logs', href: '/logs', icon: Settings },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 sidebar-transition z-40 custom-scrollbar overflow-y-auto gpu-accelerated',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <span className="font-bold text-xl">Save2740 Admin</span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-6 w-6 text-gray-600" />
          ) : (
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-lg hover-lift',
                isActive
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="h-6 w-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-base font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
