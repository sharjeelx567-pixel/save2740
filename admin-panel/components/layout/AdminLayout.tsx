'use client'

import { ReactNode, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // Start closed on mobile
  const [isCollapsed, setIsCollapsed] = useState(false) // Desktop sidebar collapsed state

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative">
          <Header
            onMenuClick={() => setIsMobileMenuOpen(true)}
            isCollapsed={isCollapsed}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8 admin-content-wrap">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
