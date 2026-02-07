"use client"

import { Trophy, CheckCircle2, Lock, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { DashboardAPI } from "@/lib/dashboard-api"

interface Achievement {
  id: string
  title: string
  desc: string
  completed: boolean
  locked: boolean
  icon: string
  points: number
}

interface AchievementsResponse {
  achievements: Achievement[]
  totalPoints: number
  unlockedCount: number
  totalCount: number
}

export function Achievements() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await DashboardAPI.getAchievements()
      if (response.success && response.data) {
        return response.data as AchievementsResponse
      }
      throw new Error('Failed to fetch achievements')
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const achievements = data?.achievements || []
  const totalPoints = data?.totalPoints || 0

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-[#1E293B] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 text-white w-full lg:w-96 flex flex-col relative overflow-hidden">
        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 md:mb-8 relative z-10">Achievements</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  // Error state - show empty achievements
  if (error || achievements.length === 0) {
    return (
      <div className="bg-[#1E293B] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 text-white w-full lg:w-96 flex flex-col relative overflow-hidden">
        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 md:mb-8 relative z-10">Achievements</h3>
        <div className="text-center py-8 relative z-10">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <p className="text-slate-400 text-sm">Start saving to unlock achievements!</p>
        </div>
        <Trophy className="absolute -right-8 top-16 w-32 h-32 text-slate-700/20 rotate-12" />
      </div>
    )
  }

  // Display top 3 achievements (prioritize unlocked, then locked)
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.completed && !b.completed) return -1
    if (!a.completed && b.completed) return 1
    return 0
  }).slice(0, 3)

  return (
    <div className="bg-[#1E293B] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 text-white w-full lg:w-96 flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 relative z-10">
        <h3 className="text-base sm:text-lg md:text-xl font-bold">Achievements</h3>
        <span className="text-xs text-amber-400 font-semibold">{totalPoints} pts</span>
      </div>

      <div className="space-y-2 sm:space-y-3 md:space-y-4 flex-1 relative z-10">
        {sortedAchievements.map((item) => (
          <div
            key={item.id}
            className={`p-2 sm:p-3 md:p-4 rounded-lg md:rounded-2xl border flex items-center justify-between transition-colors ${
              item.completed 
                ? "bg-gradient-to-r from-slate-700/30 to-slate-600/20 border-slate-600/50" 
                : "bg-slate-800/40 border-slate-700/30 opacity-50"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
              <div
                className={`w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${
                  item.locked ? "bg-slate-800" : "bg-emerald-100"
                }`}
              >
                {item.locked ? (
                  <Lock className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-xs sm:text-sm md:text-base truncate ${item.locked ? "text-slate-400" : "text-white"}`}>
                  {item.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
            {item.completed && <CheckCircle2 className="w-4 h-4 sm:w-5 md:w-6 sm:h-5 md:h-6 text-emerald-400 shrink-0" />}
          </div>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 md:mt-12 text-center relative z-10">
        <p className="italic text-slate-400 text-xs md:text-sm mb-1 md:mb-2">"The habit of saving is itself an education."</p>
        <p className="text-slate-500 text-xs">— George S. Clason</p>
      </div>

      {/* Background decoration */}
      <Trophy className="absolute -right-8 top-16 w-32 h-32 text-slate-700/20 rotate-12" />
    </div>
  )
}

