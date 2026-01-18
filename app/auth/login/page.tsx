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
      console.log("Login response:", { status: response.status, ok: response.ok, data });

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Login successful - redirect to dashboard
      console.log("Login successful, redirecting to dashboard...");
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
    <div className="min-h-screen flex flex-col md:flex-row md:overflow-hidden">
      {/* Left Side - Dark Green (All Screens - Stacks on top on mobile) */}
      <div className="w-full md:w-1/2 bg-gradient-to-b from-[#064E3B] to-[#0D6948] text-white p-6 md:p-8 lg:p-10 xl:p-12 flex flex-col justify-between h-auto md:h-screen overflow-y-auto overflow-x-hidden relative">
        <div>
          {/* Logo */}
          <div className="mb-6 md:mb-12 lg:mb-16">
            <img
              src="/login-logo.png"
              alt="Save2740 Logo"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
            />
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-3 md:mb-6">
            Save $10,000 in a year — one day at a time.
          </h1>

          {/* Description */}
          <p className="text-sm md:text-lg text-gray-100 max-w-md">
            Join the $27.40 daily challenge. Turn small consistent actions into massive yearly results ($10,000+).
          </p>
        </div>

        {/* Features at bottom */}
        <div className="w-full max-w-full">
          <div className="flex items-center gap-x-4 gap-y-3 flex-wrap mt-6 md:mt-0 justify-start text-white">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-5 h-5 rounded bg-[#10B981] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
              </div>
              <span className="text-sm text-gray-100 font-medium whitespace-nowrap">Streak Tracking</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-5 h-5 rounded bg-[#10B981] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
              </div>
              <span className="text-sm text-gray-100 font-medium whitespace-nowrap">Multipliers</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-5 h-5 rounded bg-[#10B981] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
              </div>
              <span className="text-sm text-gray-100 font-medium whitespace-nowrap">Secure Wallet</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-5 h-5 rounded bg-[#10B981] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
              </div>
              <span className="text-sm text-gray-100 font-medium whitespace-nowrap">Group Contribution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 bg-gray-50 flex items-start justify-center p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8 h-auto md:h-screen overflow-y-auto">
        <div className="w-full max-w-md py-6 sm:py-8">
          {/* Heading */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome Back</h2>
            <p className="text-sm sm:text-base text-gray-600">Enter your email and password to sign in</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent placeholder-gray-400 text-gray-900 disabled:opacity-50 text-base"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent placeholder-gray-400 text-gray-900 disabled:opacity-50 pr-10 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 accent-[#10B981] rounded cursor-pointer flex-shrink-0"
                />
                <span className="text-xs sm:text-sm text-gray-700">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm text-[#10B981] hover:text-[#0D8659] font-medium whitespace-nowrap"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#10B981] hover:bg-[#0D8659] disabled:opacity-50 text-white font-bold py-2.5 sm:py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
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
