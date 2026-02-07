"use client";

import React from "react";
import { Lock, AlertTriangle, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccountLockedScreenProps {
  accountStatus: "locked" | "suspended";
  onContactSupport?: () => void;
}

export const AccountLockedScreen: React.FC<AccountLockedScreenProps> = ({
  accountStatus,
  onContactSupport,
}) => {
  const router = useRouter();

  const isSuspended = accountStatus === "suspended";

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      window.location.href = "mailto:support@save2740.com";
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isSuspended
          ? "bg-gradient-to-br from-red-50 to-orange-50"
          : "bg-gradient-to-br from-yellow-50 to-orange-50"
      }`}
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div
              className={`rounded-full p-4 ${
                isSuspended ? "bg-red-100" : "bg-yellow-100"
              }`}
            >
              {isSuspended ? (
                <AlertTriangle
                  className={`w-8 h-8 ${isSuspended ? "text-red-600" : "text-yellow-600"}`}
                />
              ) : (
                <Lock className="w-8 h-8 text-yellow-600" />
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSuspended ? "Account Suspended" : "Account Locked"}
          </h1>

          <p className="text-gray-600 mb-6">
            {isSuspended
              ? "Your account has been suspended due to a policy violation. Please contact our support team for more information."
              : "Your account has been temporarily locked due to multiple failed login attempts. It will be automatically unlocked in 15 minutes."}
          </p>

          <div
            className={`${
              isSuspended
                ? "bg-red-50 border border-red-200"
                : "bg-yellow-50 border border-yellow-200"
            } rounded-lg p-4 mb-6 text-left`}
          >
            <p
              className={`text-sm ${
                isSuspended ? "text-red-700" : "text-yellow-700"
              }`}
            >
              <strong>Reason:</strong>{" "}
              {isSuspended
                ? "Your account has been suspended for violating our terms of service."
                : "Too many failed login attempts detected for your security."}
            </p>
          </div>

          <button
            onClick={handleContactSupport}
            className={`w-full ${
              isSuspended
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            } text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-4 flex items-center justify-center gap-2`}
          >
            <Phone className="w-5 h-5" />
            {isSuspended ? "Contact Support" : "Contact Support"}
          </button>

          <a
            href="/"
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm block"
          >
            Go to Home
          </a>
        </div>

        {!isSuspended && (
          <div className="mt-6 bg-white rounded-lg p-4 text-sm text-gray-600 text-center">
            <p>Your account will be automatically unlocked when the lockout period expires.</p>
          </div>
        )}
      </div>
    </div>
  );
};

