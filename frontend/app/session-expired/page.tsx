"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, RefreshCw, LogIn, Shield } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const returnUrl = searchParams.get("returnUrl") || "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dark Green Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#064E3B] to-[#0D6948] text-white p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="mb-16">
            <img
              src="/login-logo.png"
              alt="Save2740 Logo"
              className="h-16 w-auto"
            />
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Session Expired
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-100 max-w-md mb-8">
            Your session has expired for security reasons. Please log in again to continue.
          </p>

          {/* Security Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-white/10 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Protected Account</h3>
                <p className="text-sm text-gray-200">
                  Automatic session timeouts protect your savings account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-white/10 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Activity Monitoring</h3>
                <p className="text-sm text-gray-200">
                  We keep track of your session to ensure security
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-300">
          © 2024 Save2740. Securing your financial future.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <img
              src="/login-logo.png"
              alt="Save2740 Logo"
              className="h-12 w-auto mx-auto"
            />
          </div>

          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="bg-orange-50 rounded-full p-6 border-4 border-orange-100">
              <Clock className="h-12 w-12 text-orange-600" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Session Expired
          </h2>

          {/* Description */}
          <p className="text-center text-gray-600 mb-8">
            Your session has timed out due to inactivity. This is a security measure to protect your account.
          </p>

          {/* Info Box */}
          <div className="bg-emerald-50 border-l-4 border-brand-green rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-1">Security Notice</p>
                <p className="text-gray-700">
                  Sessions automatically expire after 30 minutes of inactivity to keep your account safe.
                </p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)}
            className="group w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-3.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-4"
          >
            <LogIn className="w-5 h-5" />
            <span>Log In Again</span>
          </button>

          {/* Home Link */}
          <Link
            href="/"
            className="block w-full text-center py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Return to Home
          </Link>

          {/* Support Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <Link href="/forgot-password" className="text-brand-green hover:underline font-medium">
                Reset your password
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-brand-green animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SessionExpiredContent />
    </Suspense>
  );
}
