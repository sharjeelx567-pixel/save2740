'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { AuthAlert } from '@/components/auth/auth-alert';
import { Lock, Ban, AlertCircle } from 'lucide-react';

function AccountStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusCode, setStatusCode] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    setStatusCode(code);

    if (code === 'ACCOUNT_LOCKED') {
      setMessage('Your account has been locked. Please contact support for assistance.');
    } else if (code === 'ACCOUNT_SUSPENDED') {
      setMessage('Your account has been suspended. Please contact support to resolve this issue.');
    } else {
      setMessage('Your account status requires attention. Please contact support.');
    }

    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  }, [searchParams]);

  const handleContactSupport = () => {
    router.push('/support');
  };

  const getIcon = () => {
    if (statusCode === 'ACCOUNT_LOCKED') {
      return <Lock className="w-12 h-12 text-red-600" />;
    } else if (statusCode === 'ACCOUNT_SUSPENDED') {
      return <Ban className="w-12 h-12 text-red-600" />;
    }
    return <AlertCircle className="w-12 h-12 text-yellow-600" />;
  };

  const getTitle = () => {
    if (statusCode === 'ACCOUNT_LOCKED') {
      return 'Account Locked';
    } else if (statusCode === 'ACCOUNT_SUSPENDED') {
      return 'Account Suspended';
    }
    return 'Account Status';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
          <p className="text-gray-600">{message}</p>
        </div>

        <AuthAlert
          type="error"
          message={message}
          title={getTitle()}
        />

        <div className="mt-6 space-y-4">
          <button
            onClick={handleContactSupport}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Contact Support
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AccountStatusContent />
    </Suspense>
  );
}