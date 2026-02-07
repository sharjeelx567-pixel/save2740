'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="pl-64 sidebar-transition">
          <Header />
          <main className="pt-16 min-h-screen page-transition">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
