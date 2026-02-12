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
  Shield,
  Link2,
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Osusu Groups', href: '/groups', icon: Users },
  { name: 'KYC Requests', href: '/kyc', icon: FileText },
  { name: 'Support Tickets', href: '/support', icon: MessageSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Useful Links', href: '/useful-links', icon: Link2 },
  { name: 'System Info', href: '/system', icon: Settings },
  { name: 'Admins', href: '/admins', icon: Shield },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Audit Logs', href: '/logs', icon: FileText },
]

// ... imports

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, toggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-gray-900/50 z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen?.(false)}
      />

      <aside
        className={cn(
          'fixed md:sticky left-0 top-0 h-screen bg-white border-r border-gray-200 transition-transform duration-300 z-50 custom-scrollbar overflow-y-auto',
          // Mobile: start hidden, slide in when open
          'w-64 -translate-x-full',
          isOpen && 'translate-x-0',
          // Desktop: always visible, width based on collapse
          'md:translate-x-0',
          isCollapsed ? 'md:w-20' : 'md:w-64'
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
          {/* Collapse button - desktop only */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto hidden md:block"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                onClick={() => setIsOpen?.(false)}
                className={cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg hover-lift min-h-[44px] touch-manipulation',
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
    </>
  )
}
