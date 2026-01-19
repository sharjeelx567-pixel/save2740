export default function Loading() {
    return (
        <>
            {/* Animated gradient backdrop */}
            <div className="fixed inset-0 bg-gradient-to-br from-emerald-50/80 via-teal-50/80 to-cyan-50/80 backdrop-blur-md z-50 animate-fade-in">
                {/* Floating particles background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-20 w-2 h-2 bg-emerald-400 rounded-full animate-float opacity-60"></div>
                    <div className="absolute top-40 right-32 w-3 h-3 bg-teal-400 rounded-full animate-float animation-delay-2000 opacity-60"></div>
                    <div className="absolute bottom-32 left-40 w-2 h-2 bg-cyan-400 rounded-full animate-float animation-delay-4000 opacity-60"></div>
                    <div className="absolute top-60 left-60 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-float animation-delay-200 opacity-60"></div>
                    <div className="absolute bottom-40 right-20 w-2.5 h-2.5 bg-teal-300 rounded-full animate-float animation-delay-400 opacity-60"></div>
                </div>
            </div>

            {/* Premium Loading Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
                <div className="relative">
                    {/* Outer glow rings - pulsing */}
                    <div className="absolute inset-0 rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse-glow"></div>
                        <div className="absolute inset-4 bg-gradient-to-r from-cyan-400/20 via-emerald-400/20 to-teal-400/20 rounded-full blur-2xl animate-pulse-glow animation-delay-200"></div>
                    </div>

                    {/* Main card with glassmorphism */}
                    <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 min-w-[320px] border border-emerald-100/50">

                        {/* Multi-layer spinner system */}
                        <div className="relative w-40 h-40 mx-auto mb-8">

                            {/* Outermost decorative ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-emerald-100/50"></div>

                            {/* Triple spinning gradient rings */}
                            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-teal-400 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                            <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-cyan-400 border-l-emerald-400 animate-spin-reverse" style={{ animationDuration: '2s' }}></div>
                            <div className="absolute inset-4 rounded-full border-[3px] border-transparent border-t-teal-500 border-r-cyan-500 animate-spin" style={{ animationDuration: '2.5s' }}></div>

                            {/* Center pulsing orb with gradient */}
                            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 animate-pulse-scale shadow-2xl shadow-emerald-500/40">
                                {/* Inner white circle */}
                                <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center">
                                    {/* Icon with breathing animation */}
                                    <div className="relative animate-float">
                                        <svg className="w-14 h-14 text-transparent" fill="url(#iconGradient)" viewBox="0 0 24 24">
                                            <defs>
                                                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#10b981" />
                                                    <stop offset="50%" stopColor="#14b8a6" />
                                                    <stop offset="100%" stopColor="#06b6d4" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Orbiting particles - 6 particles */}
                            <div className="absolute inset-0 animate-spin-slow">
                                <div className="absolute -top-2 left-1/2 -ml-2 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full shadow-lg shadow-emerald-400/50"></div>
                                <div className="absolute top-1/2 -right-2 -mt-2 w-3 h-3 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full shadow-lg shadow-teal-400/50"></div>
                            </div>
                            <div className="absolute inset-0 animate-spin-slower">
                                <div className="absolute -bottom-2 left-1/2 -ml-2 w-4 h-4 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
                                <div className="absolute top-1/2 -left-2 -mt-2 w-3 h-3 bg-gradient-to-br from-emerald-300 to-teal-300 rounded-full shadow-lg shadow-emerald-300/50"></div>
                            </div>
                            <div className="absolute inset-0 animate-spin-slowest" style={{ animationDuration: '5s' }}>
                                <div className="absolute top-0 right-1/4 w-2.5 h-2.5 bg-teal-400 rounded-full shadow-lg"></div>
                                <div className="absolute bottom-0 left-1/4 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg"></div>
                            </div>
                        </div>

                        {/* Loading text with gradient */}
                        <div className="text-center space-y-4">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent animate-fade-in-up">
                                Loading Your Experience
                            </h3>
                            <p className="text-sm text-gray-600 animate-fade-in-up animation-delay-200 font-medium">
                                Preparing something amazing for you...
                            </p>

                            {/* Animated progress dots */}
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <div className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-bounce-dot shadow-sm"></div>
                                <div className="w-2.5 h-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-bounce-dot animation-delay-200 shadow-sm"></div>
                                <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full animate-bounce-dot animation-delay-400 shadow-sm"></div>
                            </div>

                            {/* Shimmer wave effect */}
                            <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden mt-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-shimmer-fast"></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
