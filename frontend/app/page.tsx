"use client"

import { useState } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { LoadingDelay } from "@/components/loading-delay"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { HeroCard } from "@/components/hero-card"
import { StatCards } from "@/components/stat-cards"
import { SavingsBreakdown } from "@/components/savings-breakdown"
import { Achievements } from "@/components/achievements"
import { TodayContribution } from "@/components/today-contribution"
import { SavingsStreakScreen } from "@/components/savings-streak-screen"
import { MilestoneModal } from "@/components/milestone-modal"
import { MissedDayWarning } from "@/components/missed-day-warning"
import { QuoteOfDay } from "@/components/quote-of-day"
import { Sheet, SheetContent } from "@/components/ui/sheet"

function DashboardContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <LoadingDelay minDisplayTime={1000}>
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

        {/* Real-time modals and warnings */}
        <MilestoneModal />
        <MissedDayWarning />

        <main className="flex-1 overflow-y-auto flex flex-col">
          <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10 opacity-0 animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <QuoteOfDay />
              </div>
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                <HeroCard />
              </div>
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <TodayContribution />
              </div>
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
                <StatCards />
              </div>
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <SavingsStreakScreen />
              </div>
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
    </LoadingDelay>
  )
}

export default function Dashboard() {
  return (
    <ProtectedPage>
      <DashboardContent />
    </ProtectedPage>
  )
}
