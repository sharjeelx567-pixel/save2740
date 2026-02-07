"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function RouteLoader() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip on first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        setLoading(true);
        setProgress(0);

        // Simulate smooth progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 10;
            });
        }, 100);

        const timer = setTimeout(() => {
            setProgress(100);
            setTimeout(() => setLoading(false), 400);
        }, 600);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [pathname]);

    if (!loading) return null;

    return (
        <>
            {/* Backdrop with blur */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-fade-in" />

            {/* Premium Loading Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
                <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-green/30 via-emerald-400/30 to-teal-400/30 rounded-full blur-3xl animate-pulse-glow"></div>

                    {/* Main loader container */}
                    <div className="relative bg-white rounded-3xl shadow-2xl p-8 min-w-[280px]">
                        {/* Multiple spinning rings */}
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            {/* Outer ring */}
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>

                            {/* Animated gradient ring 1 */}
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-green border-r-emerald-400 animate-spin"></div>

                            {/* Animated gradient ring 2 - counter rotating */}
                            <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-teal-400 border-l-emerald-300 animate-spin-reverse"></div>

                            {/* Center gradient circle */}
                            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-brand-green via-emerald-400 to-teal-400 animate-pulse-scale shadow-xl shadow-brand-green/30">
                                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                                    {/* Animated icon */}
                                    <div className="relative">
                                        <svg className="w-10 h-10 text-brand-green animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Orbiting particles */}
                            <div className="absolute inset-0 animate-spin-slow">
                                <div className="absolute -top-1 left-1/2 -ml-1.5 w-3 h-3 bg-brand-green rounded-full shadow-lg"></div>
                                <div className="absolute top-1/2 -right-1 -mt-1.5 w-2 h-2 bg-emerald-400 rounded-full shadow-lg"></div>
                            </div>
                            <div className="absolute inset-0 animate-spin-slower">
                                <div className="absolute -bottom-1 left-1/2 -ml-1.5 w-3 h-3 bg-teal-400 rounded-full shadow-lg"></div>
                                <div className="absolute top-1/2 -left-1 -mt-1.5 w-2 h-2 bg-emerald-300 rounded-full shadow-lg"></div>
                            </div>
                        </div>

                        {/* Loading text */}
                        <div className="text-center space-y-3">
                            <h3 className="text-xl font-bold text-gray-900 animate-fade-in-up">
                                Loading
                            </h3>
                            <p className="text-sm text-gray-600 animate-fade-in-up animation-delay-200">
                                Preparing your content...
                            </p>

                            {/* Progress bar */}
                            <div className="pt-4">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand-green via-emerald-400 to-teal-400 transition-all duration-300 ease-out relative"
                                        style={{ width: `${progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast"></div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs font-medium text-brand-green text-center">
                                    {progress}%
                                </div>
                            </div>

                            {/* Animated dots */}
                            <div className="flex items-center justify-center gap-1.5 pt-2">
                                <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce-dot"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce-dot animation-delay-200"></div>
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce-dot animation-delay-400"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

