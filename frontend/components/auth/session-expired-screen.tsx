"use client";

import React from "react";
import { Clock, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface SessionExpiredScreenProps {
  onLoginClick?: () => void;
}

export const SessionExpiredScreen: React.FC<SessionExpiredScreenProps> = ({ onLoginClick }) => {
  const router = useRouter();

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 rounded-full p-4">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
          <p className="text-gray-600 mb-6">
            Your session has expired due to inactivity. For your security, please login again to continue.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-brand-green">
              <strong>Session Timeout:</strong> Sessions automatically expire after 15 minutes of inactivity for security purposes.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors mb-4"
          >
            Login Again
          </button>

          <a
            href="/"
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            Go to Home
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <LogOut className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Auto Logout</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Secure Session</p>
          </div>
        </div>
      </div>
    </div>
  );
};

