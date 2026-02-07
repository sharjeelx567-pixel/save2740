"use client"

import { ProtectedPage } from "@/components/protected-page"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, AlertCircle, CheckCircle, Info } from 'lucide-react';

type BiometricStep = 'intro' | 'setup' | 'success' | 'unavailable';

function BiometricSetupPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<BiometricStep>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(true);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face'>('fingerprint');

  // Check biometric support on mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if (!window.PublicKeyCredential) {
        setBiometricSupported(false);
        setStep('unavailable');
        return;
      }

      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          setBiometricSupported(false);
          setStep('unavailable');
        }
      } catch (err) {
        console.error('Error checking biometric support:', err);
        setBiometricSupported(false);
        setStep('unavailable');
      }
    };

    checkBiometricSupport();
  }, []);

  // Setup biometric authentication
  const handleSetupBiometric = async () => {
    setError('');
    setLoading(true);

    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported on this device');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get credential challenge from server
      const challengeResponse = await fetch('/api/auth/biometric/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to start biometric registration');
      }

      const { challenge, userId } = await challengeResponse.json();

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(Buffer.from(challenge, 'base64')),
          rp: {
            name: 'Save2740',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(Buffer.from(userId, 'base64')),
            name: 'user@save2740.com',
            displayName: 'User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          timeout: 60000,
          attestation: 'direct',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
          },
        },
      } as any);

      if (!credential) {
        throw new Error('Failed to create biometric credential');
      }

      // Verify credential on server
      const credentialData = {
        id: credential.id,
        type: credential.type,
        rawId: Array.from(new Uint8Array((credential as any).rawId || [])),
      };

      const verifyResponse = await fetch('/api/auth/biometric/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          credential: credentialData,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify biometric credential');
      }

      setStep('success');

      // Redirect after delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to setup biometric';
      setError(message);
      console.error('Biometric setup error:', err);
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
            <div className="bg-purple-100 rounded-full p-4">
              <Fingerprint className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          {/* Intro Step */}
          {step === 'intro' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Biometric Login
              </h1>

              <p className="text-center text-gray-600 text-sm mb-6">
                Add an extra layer of security to your account
              </p>

              {/* Benefits */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Faster Login</p>
                    <p className="text-xs text-gray-600">Login with your fingerprint or face</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Extra Security</p>
                    <p className="text-xs text-gray-600">Biometric data never leaves your device</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Always Optional</p>
                    <p className="text-xs text-gray-600">Password login always available</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <Alert className="mb-6 border-green-200 bg-green-50">
                <Info className="h-4 w-4 text-brand-green" />
                <AlertDescription className="text-brand-green text-xs">
                  Your biometric data is stored securely on your device only.
                </AlertDescription>
              </Alert>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => setStep('setup')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2"
                >
                  Enable Biometric Login
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Maybe Later
                </Button>
              </div>
            </>
          )}

          {/* Setup Step */}
          {step === 'setup' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Register Your Biometric
              </h1>

              <p className="text-center text-gray-600 text-sm mb-6">
                {biometricType === 'fingerprint'
                  ? 'Place your finger on your device scanner'
                  : 'Position your face in front of the camera'}
              </p>

              {/* Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Instructions:</h3>
                <ul className="text-xs text-gray-700 space-y-2 list-disc list-inside">
                  {biometricType === 'fingerprint' ? (
                    <>
                      <li>Use your preferred finger</li>
                      <li>Ensure your finger is clean and dry</li>
                      <li>Place firmly on the scanner</li>
                      <li>Hold until registration completes</li>
                    </>
                  ) : (
                    <>
                      <li>Ensure good lighting</li>
                      <li>Face the camera directly</li>
                      <li>Keep your face in frame</li>
                      <li>Do not use accessories (glasses, masks)</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Setup Button */}
              <Button
                onClick={handleSetupBiometric}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Start Biometric Setup'}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep('intro')}
                className="w-full mt-3 text-gray-600 hover:text-gray-900"
              >
                Back
              </Button>
            </>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <>
              <div className="text-center mb-6">
                <div className="bg-green-100 rounded-full p-4 w-fit mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  All Set!
                </h1>
                <p className="text-gray-600 text-sm">
                  Your biometric authentication is ready
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  You can now use your{' '}
                  <span className="font-semibold">
                    {biometricType === 'fingerprint' ? 'fingerprint' : 'face'}
                  </span>{' '}
                  to login to your account.
                </p>
              </div>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {/* Unavailable Step */}
          {step === 'unavailable' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Not Available
              </h1>

              <p className="text-center text-gray-600 text-sm mb-6">
                Biometric authentication is not supported on this device
              </p>

              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  Your device does not have a compatible biometric scanner (fingerprint or face recognition).
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Compatible devices:</span>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>iPhone 5s and later with Face ID or Touch ID</li>
                  <li>Android 7.0+ with biometric hardware</li>
                  <li>Windows 10+ with Windows Hello</li>
                </ul>
              </div>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              >
                Continue
              </Button>
            </>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="mt-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function BiometricSetupPage() {
  return (
    <ProtectedPage>
      <BiometricSetupPageContent />
    </ProtectedPage>
  )
}

