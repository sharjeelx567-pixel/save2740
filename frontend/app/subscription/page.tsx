"use client"

import { ProtectedPage } from "@/components/protected-page"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Download } from "lucide-react"

const billingHistory = [
  {
    id: 1,
    title: "Subscription Activation",
    description: "Oct 01 • Yearly Plan Started",
    amount: "$0.00 (Deferred)",
    icon: "✓",
  },
]

function SubscriptionPageContent() {
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

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="Subscription & Billing" onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">

          {/* Active Subscription Card */}
          <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 bg-brand-green rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 sm:w-7 md:w-10 sm:h-7 md:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Yearly Challenge</h3>
                    <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">App Fee: $292.80 / Year</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-brand-green px-2.5 sm:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Billing Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 pt-4 sm:pt-6 border-t border-slate-100">
                <div className="pt-3 sm:pt-4 md:pt-6">
                  <p className="text-slate-500 text-xs md:text-sm font-medium mb-1 md:mb-2">Next Billing Event</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Withdrawal Maturity</p>
                </div>
                <div className="pt-3 sm:pt-4 md:pt-6">
                  <p className="text-slate-500 text-xs md:text-sm font-medium mb-1 md:mb-2">Accrued App Fees</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800">$292.80</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History Section */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Billing History</h2>
              <button className="text-brand-green text-xs sm:text-sm font-semibold hover:underline flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>

            <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {billingHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 md:p-6 flex items-start justify-between hover:bg-slate-50 transition-colors gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-1">
                          <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-brand-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-semibold text-slate-800">{item.title}</p>
                          <p className="text-xs md:text-sm text-slate-500 mt-1">{item.description}</p>
                        </div>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-slate-700 whitespace-nowrap text-right">
                        {item.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <ProtectedPage>
      <SubscriptionPageContent />
    </ProtectedPage>
  )
}
