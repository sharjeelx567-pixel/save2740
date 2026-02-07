'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut } from 'lucide-react';

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Logout failed:', data.error);
      }

      // Clear ALL auth-related data regardless of response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      localStorage.removeItem('userId');
      localStorage.removeItem('pending_email_verification');
      localStorage.removeItem('temp_user');

      // Close modal
      onOpenChange(false);

      // Force full page reload to clear React Query cache and all state
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout on error - clear all data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      localStorage.removeItem('userId');
      localStorage.removeItem('pending_email_verification');
      localStorage.removeItem('temp_user');
      onOpenChange(false);
      window.location.href = '/auth/login';
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            Are you sure you want to logout? You'll need to login again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel disabled={loading} className="border-gray-300">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

