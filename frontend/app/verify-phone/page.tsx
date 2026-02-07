'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, AlertCircle, CheckCircle } from 'lucide-react';

export default function VerifyPhonePage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  // Format for display
  const formatPhone = (value: string) => {
    if (!value) return '';
    if (value.length <= 3) return value;
    if (value.length <= 6) return `(${value.slice(0, 3)}) ${value.slice(3)}`;
    return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
  };

  // Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);

    try {
      // In production, call your API to send OTP
      // For now, we'll simulate the OTP process
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      setSuccess('OTP sent to your phone');
      setStep('otp');
      setResendCountdown(60); // 60 second countdown

      // Countdown timer
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length < 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      if (!response.ok) {
        throw new Error('Invalid OTP');
      }

      setSuccess('Phone verified successfully!');
      setStep('success');

      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0">
        <div className="p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 rounded-full p-4">
              <Smartphone className="h-8 w-8 text-brand-green" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {step === 'phone' && 'Add Phone Number'}
            {step === 'otp' && 'Enter OTP'}
            {step === 'success' && 'Phone Verified'}
          </h1>

          <p className="text-center text-gray-600 text-sm mb-6">
            {step === 'phone' && 'Secure your account with phone verification'}
            {step === 'otp' && 'Check your SMS for the 6-digit code'}
            {step === 'success' && 'Your phone has been verified successfully'}
          </p>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Phone Input */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                  Phone Number
                </Label>
                <div className="mt-2 flex items-center">
                  <span className="text-gray-600 pr-3">+1</span>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="(555) 123-4567"
                    value={formatPhone(phoneNumber)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1 border-gray-300"
                    maxLength={14}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  US phone number required. Standard rates apply.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-2 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {/* OTP Input */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Label htmlFor="otp" className="text-sm font-semibold text-gray-900">
                  6-Digit Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-2 border-gray-300 text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the code sent to {formatPhone(phoneNumber)}
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={resendCountdown > 0 || loading}
                onClick={handleSendOTP}
                className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : 'Resend Code'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="w-full text-gray-600 hover:text-gray-900"
              >
                Change Phone Number
              </Button>
            </form>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Your phone number {formatPhone(phoneNumber)} has been verified.
                </p>
              </div>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-2"
              >
                Continue to Dashboard
              </Button>
            </div>
          )}

          {/* Skip Link */}
          {step !== 'success' && (
            <p className="text-center text-gray-500 text-xs mt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-brand-green hover:underline"
              >
                Skip for now
              </button>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

