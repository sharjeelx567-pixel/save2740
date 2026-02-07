"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { API } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, isAuthenticated, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Capture referral code from URL
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      console.log('[Signup] Referral code captured:', ref);

      // If user is already logged in but visiting with a referral code, 
      // assume they want to create a new account and logout the current one.
      if (!loading && isAuthenticated) {
        console.log('[Signup] Logging out existing user for referral signup');
        logout();
      }
    }
  }, [searchParams, loading, isAuthenticated, logout]);

  // Step 1 - Profile Setup
  const [profileData, setProfileData] = useState({
    firstName: "",
    email: "",
    password: "",
  });

  // Step 2 - Challenge Selection
  const [challengeData, setChallengeData] = useState({
    selectedChallenge: "daily", // daily, weekly, monthly
    selectedMultiplier: 1,
  });

  const challenges = {
    daily: { name: "Daily", base: 27.4, yearlyGoal: 10000 },
    weekly: { name: "Weekly", base: 191.8, yearlyGoal: 10000 },
    monthly: { name: "Monthly", base: 849.4, yearlyGoal: 10000 },
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate profile data
    if (!profileData.firstName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!profileData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!profileData.password.trim()) {
      setError("Password is required");
      return;
    }
    if (profileData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setStep(2);
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const challenge = challenges[challengeData.selectedChallenge as keyof typeof challenges];
      const dailyAmount = challenge.base * challengeData.selectedMultiplier;

      const apiUrl = API.BASE_URL;
      console.log('Signup Debug - Target API URL:', apiUrl); // Debug log
      if (referralCode) {
        console.log('Signup Debug - Using referral code:', referralCode);
      }
      const nameParts = profileData.firstName.trim().split(' ');
      const firstNameToSend = nameParts[0];
      const lastNameToSend = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0]; // Fallback to first name if no last name

      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstNameToSend,
          lastName: lastNameToSend,
          email: profileData.email,
          password: profileData.password,
          selectedChallenge: challengeData.selectedChallenge,
          multiplier: challengeData.selectedMultiplier,
          referralCode: referralCode || undefined, // Include referral code if present
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        setIsLoading(false);
        return;
      }

      // Show success message and redirect to login
      alert("Account created successfully! Please log in.");
      router.push("/auth/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      router.push("/auth/login");
    }
  };

  const currentChallenge = challenges[challengeData.selectedChallenge as keyof typeof challenges];
  const dailyAmount = currentChallenge.base * challengeData.selectedMultiplier;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="text-[#10B981] hover:text-[#0D8659] transition-colors p-1 sm:p-1.5"
            >
              <ChevronLeft size={16} className="sm:w-6 sm:h-6" />
            </button>
            <span className="text-sm font-medium text-gray-600">
              Step {step} of 2
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1 - Create Account */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600 text-xs sm:text-sm mb-4">
              Let's get your profile set up to track your progress.
            </p>

            {/* Referral Code Badge */}
            {referralCode && (
              <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <span className="text-emerald-600 text-sm">🎉 You were referred by a friend!</span>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-mono px-2 py-1 rounded">
                  {referralCode}
                </span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleNextStep} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="e.g Alex Johnson"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent placeholder-gray-400 text-gray-900"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent placeholder-gray-400 text-gray-900"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Your password"
                    value={profileData.password}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent placeholder-gray-400 text-gray-900 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  At least 8 characters, 1 uppercase, 1 lowercase, and 1 number
                </p>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="w-full bg-[#10B981] hover:bg-[#0D8659] text-white font-bold py-3 px-6 rounded-lg transition-colors mt-8"
              >
                Next: Choose Challenge
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-[#10B981] hover:text-[#0D8659] font-bold">
                  Login
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2 - Choose Challenge */}
        {step === 2 && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">Choose Your Challenge</h2>

            {/* Challenge Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
              {Object.entries(challenges).map(([key, challenge]) => (
                <button
                  key={key}
                  onClick={() => setChallengeData({ ...challengeData, selectedChallenge: key })}
                  className={`p-3 sm:p-4 md:p-6 rounded-lg border-2 transition-all ${challengeData.selectedChallenge === key
                    ? "border-[#10B981] bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                >
                  <div className="font-bold text-sm sm:text-base md:text-lg text-gray-900">{challenge.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    ${challenge.base.toFixed(2)} Base
                  </div>
                </button>
              ))}
            </div>

            {/* Multiplier Selection */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="font-bold text-sm sm:text-base md:text-lg text-gray-900 mb-3 sm:mb-4 md:mb-6">
                <span className="text-gray-700">Multiplier: </span>
                <span className="text-teal-600">x{challengeData.selectedMultiplier}</span>
              </div>

              {/* Slider */}
              <div className="relative mb-3 sm:mb-4 md:mb-6">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={challengeData.selectedMultiplier}
                  onChange={(e) => setChallengeData({ ...challengeData, selectedMultiplier: parseInt(e.target.value) })}
                  className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                />

                {/* Labels row - Mobile: Show only odd numbers for better spacing */}
                <div className="md:hidden flex justify-between text-xs font-medium text-gray-700 px-0 mt-2">
                  {[1, 3, 5, 7, 9].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setChallengeData({ ...challengeData, selectedMultiplier: mult })}
                      className={`transition-colors min-w-[40px] text-center py-1 px-2 rounded ${challengeData.selectedMultiplier === mult
                        ? "text-[#10B981] font-bold bg-[#D1FAE5]"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      x{mult}
                    </button>
                  ))}
                </div>

                {/* Labels row - Desktop: Show all numbers */}
                <div className="hidden md:flex justify-between text-sm font-medium text-gray-700 px-1 mt-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setChallengeData({ ...challengeData, selectedMultiplier: mult })}
                      className={`transition-colors min-w-[24px] text-center ${challengeData.selectedMultiplier === mult
                        ? "text-[#10B981] font-bold"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      x{mult}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Commitment Card */}
            <div className="bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-8 mb-4 sm:mb-6 md:mb-8 text-white">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4 md:gap-6 text-center sm:text-left">
                <div>
                  <div className="text-xs sm:text-sm md:text-sm text-gray-400 mb-1">Your Commitment</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#10B981]">
                    ${dailyAmount.toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm md:text-sm text-gray-400 mt-1">per Day</div>
                </div>
                <div className="text-center sm:text-right border-t sm:border-t-0 border-gray-800 pt-3 sm:pt-0 w-full sm:w-auto">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">
                    ${currentChallenge.yearlyGoal.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm md:text-sm text-gray-400 mt-1">Yearly Goal</div>
                </div>
              </div>
            </div>

            {/* Start Saving Button */}
            <button
              onClick={handleCompleteSignup}
              disabled={isLoading}
              className="w-full bg-[#10B981] hover:bg-[#0D8659] disabled:opacity-50 text-white font-bold py-3 px-4 sm:px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isLoading ? "Creating Account..." : "Start Saving Now →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
