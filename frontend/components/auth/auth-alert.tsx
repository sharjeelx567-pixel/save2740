"use client";

import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface AuthAlertProps {
  type: "error" | "success" | "info";
  message: string;
  title?: string;
  onClose?: () => void;
}

export const AuthAlert: React.FC<AuthAlertProps> = ({ type, message, title, onClose }) => {
  const bgColor = {
    error: "bg-red-50",
    success: "bg-green-50",
    info: "bg-green-50",
  };

  const borderColor = {
    error: "border-red-200",
    success: "border-green-200",
    info: "border-green-200",
  };

  const textColor = {
    error: "text-red-800",
    success: "text-green-800",
    info: "text-slate-900",
  };

  const icon = {
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div
      className={`border rounded-lg p-4 ${bgColor[type]} ${borderColor[type]} ${textColor[type]} flex items-start gap-3`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icon[type]}</div>
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-auto"
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};

