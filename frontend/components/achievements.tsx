import { Trophy, CheckCircle2, Lock } from "lucide-react"

const achievements = [
  { title: "7 Day Streak", desc: "Consistency is key!", completed: true },
  { title: "Month Master", desc: "30 days straight!", completed: true },
  { title: "$5k Club", desc: "Save $5,000 to unlock", completed: false, locked: true },
]

export function Achievements() {
  return (
    <div className="bg-[#1E293B] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 text-white w-full lg:w-96 flex flex-col relative overflow-hidden">
      <h3 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 md:mb-8 relative z-10">Achievements</h3>

      <div className="space-y-2 sm:space-y-3 md:space-y-4 flex-1 relative z-10">
        {achievements.map((item) => (
          <div
            key={item.title}
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
