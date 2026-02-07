'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Mail, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verified, setVerified] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Check if token is in URL
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      handleVerifyEmail(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSendVerification = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification email');
        return;
      }

      setSuccess('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setError('An error occurred. Please try again.');
      console.error('Send verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (verifyToken: string) => {
    setVerifyLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to verify email');
        return;
      }

      setSuccess('Email verified successfully!');
      setVerified(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError('An error occurred. Please try again.');
      console.error('Verify email error:', err);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="text-4xl">✉️</div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <p className="text-sm text-gray-600">
            {verified ? 'Email verified successfully!' : 'Complete your registration'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className={verified ? 'border-green-200 bg-green-50' : 'border-green-200 bg-green-50'}>
              <CheckCircle2 className={`h-4 w-4 ${verified ? 'text-green-600' : 'text-brand-green'}`} />
              <AlertDescription className={verified ? 'text-green-800' : 'text-brand-green'}>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {!verified && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Mail className="h-8 w-8 text-brand-green" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {email ? (
                    <>
                      A verification link has been sent to <strong>{email}</strong>
                    </>
                  ) : (
                    'Check your email for a verification link'
                  )}
                </p>
                <p className="text-xs text-gray-500">The link expires in 24 hours</p>
              </div>

              <div className="space-y-2">
                {token ? (
                  <Button
                    onClick={() => handleVerifyEmail(token)}
                    disabled={verifyLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {verifyLoading ? 'Verifying...' : 'Verify Email'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendVerification}
                    disabled={loading || !email}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? 'Sending...' : 'Send Verification Email'}
                  </Button>
                )}
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already verified?</span>
                </div>
              </div>

              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}

          {verified && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 mb-4">You'll be redirected to the dashboard in a moment...</p>
              <Link href="/dashboard">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Go to Dashboard Now
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-green mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

