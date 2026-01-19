"use client"

import { useState, useEffect } from "react"
import { Trophy, Sparkles, X } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"

interface Milestone {
  amount: number
  label: string
  emoji: string
}

const MILESTONES: Milestone[] = [
  { amount: 500, label: "Savings Starter", emoji: "🌱" },
  { amount: 1000, label: "Bronze Saver", emoji: "🥉" },
  { amount: 2500, label: "Silver Saver", emoji: "🥈" },
  { amount: 5000, label: "Gold Saver", emoji: "🥇" },
  { amount: 7500, label: "Platinum Saver", emoji: "💎" },
  { amount: 10000, label: "Master Saver", emoji: "👑" },
]

/**
 * MilestoneModal Component
 * Displays achievements when user reaches savings milestones
 */
export function MilestoneModal() {
  const { data } = useWallet()
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [seenMilestones, setSeenMilestones] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!data) return

    const balance = data.balance || 0
    const newUnlockedMilestones = MILESTONES.filter(
      (m) => balance >= m.amount && !seenMilestones.has(m.amount)
    )

    if (newUnlockedMilestones.length > 0) {
      setNewMilestones(newUnlockedMilestones)
      setIsOpen(true)

      // Mark as seen
      const updatedSeen = new Set(seenMilestones)
      newUnlockedMilestones.forEach((m) => updatedSeen.add(m.amount))
      setSeenMilestones(updatedSeen)

      // Auto-close after 5 seconds
      const timer = setTimeout(() => setIsOpen(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [data, seenMilestones])

  if (!isOpen || newMilestones.length === 0) return null

  const milestone = newMilestones[newMilestones.length - 1]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-50">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 p-1 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </button>

        {/* Gradient header */}
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-8 pt-12 text-center">
          <div className="text-6xl mb-4 animate-bounce">{milestone.emoji}</div>
          <h2 className="text-3xl font-bold text-white mb-2">Milestone Unlocked!</h2>
          <p className="text-white/90 text-sm">You've reached a new savings achievement</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Achievement
            </span>
          </div>

          <h3 className="text-2xl font-bold text-slate-800 mb-2">{milestone.label}</h3>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 border border-emerald-200">
            <p className="text-3xl font-bold text-emerald-600">
              ${milestone.amount.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600 mt-1">Saved Successfully</p>
          </div>

          <p className="text-slate-600 text-sm mb-6">
            Keep up the amazing work! Every dollar counts toward your financial freedom.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Celebrate
              </span>
            </button>
          </div>

          {/* Progress to next milestone */}
          {data && MILESTONES.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Next Milestone
              </p>
              {(() => {
                const nextMilestone = MILESTONES.find((m) => m.amount > (data.balance || 0))
                if (nextMilestone) {
                  const progress = ((data.balance || 0) / nextMilestone.amount) * 100
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-700">
                          {nextMilestone.label}
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          ${(nextMilestone.amount - (data.balance || 0)).toLocaleString()} away
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  )
                }
                return (
                  <p className="text-sm text-emerald-600 font-semibold">
                    🎉 You've unlocked all milestones!
                  </p>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
