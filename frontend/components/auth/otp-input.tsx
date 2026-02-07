"use client";

import React, { InputHTMLAttributes } from "react";

interface OTPInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  error?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  ...props
}) => {
  const [otp, setOtp] = React.useState<string[]>(Array(length).fill(""));
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    setOtp(value.split("").slice(0, length).concat(Array(length).fill("")).slice(0, length));
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    const otpValue = newOtp.join("");
    onChange(otpValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (otpValue.length === length && onComplete) {
      onComplete();
    }
  };

  const handleBackspace = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      onChange(newOtp.join(""));

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    if (!/^\d*$/.test(pasteData)) return;

    const digits = pasteData.split("").slice(0, length);
    const newOtp = Array(length).fill("");
    digits.forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);
    onChange(newOtp.join(""));

    if (digits.length === length) {
      inputRefs.current[length - 1]?.focus();
      onComplete?.();
    } else {
      inputRefs.current[digits.length]?.focus();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 justify-center">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleBackspace(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none transition-all ${
              error ? "border-red-500" : "border-gray-300 focus:border-emerald-500"
            } ${disabled ? "bg-gray-100 text-gray-500" : "bg-white"}`}
            {...props}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
};

