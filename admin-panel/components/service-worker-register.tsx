"use client";

import { useEffect } from 'react';

/**
 * Service Worker Registration Component - Admin Panel
 * DISABLED: Causing redirect issues. Will re-enable when FCM is properly configured.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Disabled temporarily - was blocking login redirect
    console.log('ℹ️ [Admin] Service Worker registration disabled (FCM not configured)');
  }, []);

  return null; // This component doesn't render anything
}
