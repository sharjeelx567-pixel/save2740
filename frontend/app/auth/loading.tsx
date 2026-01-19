export default function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#064E3B] via-[#0D6948] to-[#065F46] relative overflow-hidden">
            {/* Animated background patterns */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full animate-ping-slow"></div>
                    <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white rounded-full animate-ping-slower"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-white rounded-full animate-ping-slowest"></div>
                </div>
            </div>

            {/* Loading content */}
            <div className="relative z-10 text-center">
                {/* Premium animated loader */}
                <div className="relative w-40 h-40 mx-auto mb-8">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl animate-pulse-glow"></div>

                    {/* Rotating gradient rings */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 border-r-emerald-300 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-white border-l-white/80 animate-spin-reverse"></div>
                    </div>

                    {/* Center pulsing circle */}
                    <div className="absolute inset-8 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-green-400 animate-pulse-scale shadow-2xl shadow-emerald-500/50">
                        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#064E3B] to-[#0D6948] flex items-center justify-center">
                            {/* Inner animated icon */}
                            <div className="relative">
                                <svg className="w-12 h-12 text-white animate-float" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Orbiting dots */}
                    <div className="absolute inset-0 animate-spin-slow">
                        <div className="absolute -top-2 left-1/2 -ml-2 w-4 h-4 bg-emerald-300 rounded-full shadow-lg shadow-emerald-400/50"></div>
                    </div>
                    <div className="absolute inset-0 animate-spin-slower">
                        <div className="absolute -bottom-2 left-1/2 -ml-2 w-4 h-4 bg-white rounded-full shadow-lg shadow-white/50"></div>
                    </div>
                </div>

                {/* Text content with animations */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white animate-fade-in-up">
                        Preparing Your Account
                    </h2>
                    <p className="text-emerald-100 text-lg animate-fade-in-up animation-delay-200">
                        Setting up your personalized experience
                    </p>

                    {/* Animated progress bar */}
                    <div className="max-w-xs mx-auto mt-8">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 animate-shimmer-fast"></div>
                        </div>
                    </div>

                    {/* Bouncing dots */}
                    <div className="flex items-center justify-center gap-2 pt-6">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce-dot shadow-lg shadow-emerald-400/50"></div>
                        <div className="w-3 h-3 bg-teal-300 rounded-full animate-bounce-dot animation-delay-200 shadow-lg shadow-teal-300/50"></div>
                        <div className="w-3 h-3 bg-white rounded-full animate-bounce-dot animation-delay-400 shadow-lg shadow-white/50"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
