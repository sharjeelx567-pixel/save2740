"use client"

export function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 px-4 py-3 bg-slate-100 rounded-2xl rounded-bl-sm w-fit">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-dot"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-dot animation-delay-200"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-dot animation-delay-400"></div>
            </div>
        </div>
    );
}
