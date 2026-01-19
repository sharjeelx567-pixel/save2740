"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Clock, Mail, AlertCircle, Shield, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function AccountLockedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockUntilParam = searchParams.get("lockUntil");
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!lockUntilParam) {
      setTimeRemaining("15 minutes");
      return;
    }

    const lockUntilTime = new Date(parseInt(lockUntilParam, 10));

    const updateTimer = () => {
      const now = new Date();
      const diff = lockUntilTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("0 minutes");
        setCanRetry(true);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lockUntilParam]);

  const handleRetryLogin = () => {
    localStorage.removeItem("lockedEmail");
    router.push("/auth/login");
  };

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
            Account Temporarily Locked
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-100 max-w-md mb-8">
            Your account has been locked due to multiple failed login attempts. This security measure protects your savings.
          </p>

          {/* Security Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-white/10 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Account Protection</h3>
                <p className="text-sm text-gray-200">
                  Automatic lockout after failed attempts prevents unauthorized access
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-white/10 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Security First</h3>
                <p className="text-sm text-gray-200">
                  We take your financial security seriously
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-white/10 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Need Help?</h3>
                <p className="text-sm text-gray-200">
                  Reset your password or contact our support team
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

      {/* Right Side - Content */}
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
            <div className="bg-red-50 rounded-full p-6 border-4 border-red-100 relative">
              <Lock className="h-12 w-12 text-red-600" />
              <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1.5">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Account Locked
          </h2>

          {/* Description */}
          <p className="text-center text-gray-600 mb-8">
            Too many failed login attempts. Your account is temporarily locked for security.
          </p>

          {/* Timer Box */}
          <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">Time Remaining</p>
                <p className="text-2xl font-mono font-bold text-red-600">{timeRemaining}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-red-200">
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Reason:</span> Multiple failed login attempts detected
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-1">What can you do?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Wait for the lockout period to expire</li>
                  <li>Reset your password if you've forgotten it</li>
                  <li>Contact support if this was not you</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleRetryLogin}
              disabled={!canRetry}
              className="group w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-3.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              <span>{canRetry ? "Return to Login" : "Locked - Try Again Later"}</span>
            </button>

            <Link
              href="/forgot-password"
              className="block w-full border-2 border-gray-300 hover:border-brand-green hover:bg-emerald-50 text-gray-700 hover:text-brand-green font-semibold py-3.5 px-4 rounded-lg transition-all duration-200 text-center"
            >
              Reset Password Instead
            </Link>
          </div>

          {/* Support */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Think this is an error?
            </p>
            <a
              href="mailto:support@save2740.com"
              className="inline-flex items-center gap-2 text-brand-green hover:underline font-medium text-sm"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountLockedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-brand-green animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AccountLockedContent />
    </Suspense>
  );
}
