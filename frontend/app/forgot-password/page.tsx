'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to process request');
        setLoading(false);
        return;
      }

      // Redirect to reset password page with email
      setSubmitted(true);
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      setError('An error occurred. Please try again.');
      console.error('Forgot password error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="text-4xl">🔐</div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <p className="text-sm text-gray-600">
            {submitted ? 'Check your email for reset instructions' : 'Enter your email to reset your password'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {!submitted ? (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Remember your password?</span>
                </div>
              </div>

              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700">
                  Back to Login
                </Button>
              </Link>
            </>
          ) : (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  If an account exists with this email, an OTP has been sent to your email address.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-gray-600">
                Check your email inbox for the 6-digit OTP code. The OTP expires in 15 minutes.
                Redirecting you to the reset password page...
              </p>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">Can't find the email? Check your spam folder.</p>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700"
                >
                  Try another email
                </Button>
              </div>

              <Link href="/auth/login">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

