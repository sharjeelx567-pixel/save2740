"use client"

import { useState } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Lock } from "lucide-react"

const achievements = [
  {
    id: 1,
    title: "7 Day Streak",
    description: "Consistency is key!",
    completed: true,
    locked: false,
    icon: "🔥",
  },
  {
    id: 2,
    title: "Month Master",
    description: "30 days straight!",
    completed: true,
    locked: false,
    icon: "📅",
  },
  {
    id: 3,
    title: "$5k Club",
    description: "Save $5,000 to unlock",
    completed: false,
    locked: true,
    icon: "🏆",
  },
  {
    id: 4,
    title: "$5k Club",
    description: "Save $5,000 to unlock",
    completed: false,
    locked: true,
    icon: "🏆",
  },
]

function AchievementsPageContent() {
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
        <DashboardHeader title="Achievements" onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">

          {/* Featured Achievement - Level 4 Saver */}
          <Card className="bg-[#1E293B] border-none rounded-2xl md:rounded-3xl overflow-hidden text-white">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Level 4 Saver</h2>
                <p className="text-slate-400 text-sm md:text-base">You're on fire! Keep the streak alive.</p>
              </div>

              {/* Progress Section */}
              <div className="space-y-4">
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-brand-green rounded-full transition-all duration-1000"
                    style={{ width: "75%" }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-slate-400">Level 4</p>
                  </div>
                  <div className="text-center">
                    <p className="text-brand-green font-bold text-lg">750 / 1000 XP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Level 5</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`border rounded-2xl md:rounded-3xl overflow-hidden transition-opacity ${
                  achievement.locked
                    ? "bg-slate-50 border-slate-100 opacity-50"
                    : "bg-white border-slate-100 hover:shadow-md"
                }`}
              >
                <CardContent className="p-4 md:p-6 space-y-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl flex items-center justify-center text-2xl md:text-4xl ${
                      achievement.locked ? "bg-slate-200" : "bg-emerald-50"
                    }`}
                  >
                    {achievement.locked ? (
                      <Lock className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
                    ) : (
                      achievement.icon
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <h3
                      className={`text-base md:text-lg font-bold mb-1 ${
                        achievement.locked ? "text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500">
                      {achievement.description}
                    </p>
                  </div>

                  {/* Completion Badge */}
                  {achievement.completed && (
                    <div className="flex items-center gap-2 pt-2">
                      <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-brand-green" />
                      <span className="text-xs md:text-sm font-semibold text-brand-green">Completed</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}

export default function AchievementsPage() {
  return (
    <ProtectedPage>
      <AchievementsPageContent />
    </ProtectedPage>
  )
}
