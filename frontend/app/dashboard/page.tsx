/**
 * Dashboard Page
 * Main money view - heart of Save2740 application
 * Shows all dynamic data and includes all modals/popups
 */

"use client"

import { useState } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { HeroCard } from "@/components/hero-card"
import { StatCards } from "@/components/stat-cards"
import { TodayContribution } from "@/components/today-contribution"
import { MilestoneModal } from "@/components/milestone-modal"
import { MissedDayWarning } from "@/components/missed-day-warning"
import { TransactionNotificationContainer } from "@/components/transaction-notification"
import { QuoteOfDay } from "@/components/quote-of-day"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SavingsBreakdown } from "@/components/savings-breakdown"
import { Achievements } from "@/components/achievements"
import { SavingsStreakScreen } from "@/components/savings-streak-screen"


function DashboardPageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

      {/* All Modals and Popups */}
      <MilestoneModal />
      <MissedDayWarning />
      <TransactionNotificationContainer />

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10 opacity-0 animate-fade-in overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-0">
            {/* Quote of the Day - Dynamic */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <QuoteOfDay />
            </div>

            {/* Hero Card - Shows dynamic balance and progress */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
              <HeroCard />
            </div>

            {/* Today's Contribution - Dynamic status */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <TodayContribution />
            </div>

            {/* Stat Cards - Dynamic metrics */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
              <StatCards />
            </div>

            {/* Savings Streak - Dynamic streak data */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <SavingsStreakScreen />
            </div>

            {/* Savings Breakdown and Achievements - Dynamic data */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 opacity-0 animate-slide-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
              <div className="flex-1">
                <SavingsBreakdown />
              </div>
              <div className="w-full lg:w-96">
                <Achievements />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <DashboardPageContent />
    </ProtectedPage>
  )
}

