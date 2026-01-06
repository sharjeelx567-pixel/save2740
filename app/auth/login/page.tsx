"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Login successful - redirect to dashboard
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dark Green */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#064E3B] to-[#0D6948] text-white p-8 xl:p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="mb-12 lg:mb-16">
            <img
              src="/login-logo.png"
              alt="Save2740 Logo"
              className="h-12 sm:h-14 lg:h-16 w-auto"
            />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 lg:mb-6">
            Master Your Savings Habit.
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base lg:text-lg text-gray-100 max-w-md">
            Join the $27.40 daily challenge. Turn small consistent actions into massive yearly results ($10,000+).
          </p>
        </div>

        {/* Features at bottom */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
              <Check size={16} className="text-white sm:w-5" strokeWidth={3} />
            </div>
            <span className="text-xs sm:text-sm lg:text-base text-gray-100 font-medium">Streak Tracking</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
              <Check size={16} className="text-white sm:w-5" strokeWidth={3} />
            </div>
            <span className="text-xs sm:text-sm lg:text-base text-gray-100 font-medium">Multipliers</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
              <Check size={16} className="text-white sm:w-5" strokeWidth={3} />
            </div>
            <span className="text-xs sm:text-sm lg:text-base text-gray-100 font-medium">Secure Wallet</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-4 sm:p-6 min-h-screen">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-sm sm:text-base text-gray-600">Enter your email and password to sign in</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent placeholder-gray-400 text-gray-900 disabled:opacity-50 text-sm"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent placeholder-gray-400 text-gray-900 disabled:opacity-50 pr-10 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 accent-[#10B981] rounded cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-gray-700">Remember me</span>
              </label>
              <a
                href="#"
                className="text-xs sm:text-sm text-[#10B981] hover:text-[#0D8659] font-medium"
              >
                Forgot Password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#10B981] hover:bg-[#0D8659] disabled:opacity-50 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-[#10B981] hover:text-[#0D8659] font-bold"
              >
                Start Challenge
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
