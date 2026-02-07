/**
 * Lazy Loading Configuration
 * Centralized lazy loading for heavy components to improve initial bundle size
 */

import dynamic from 'next/dynamic';

/**
 * Profile Components - Load only when profile page is visited
 */
export const LazyEditProfile = dynamic(
    () => import('@/components/profile/edit-profile').then(mod => ({ default: mod.EditProfile })),
    { ssr: false }
);

export const LazyKYCStatus = dynamic(
    () => import('@/components/profile/kyc-status').then(mod => ({ default: mod.KYCStatus })),
    { ssr: false }
);

export const LazyAccountSettings = dynamic(
    () => import('@/components/profile/account-settings').then(mod => ({ default: mod.AccountSettings })),
    { ssr: false }
);

/**
 * Wallet Components - Heavy transaction tables and charts
 */
export const LazyTransactionHistory = dynamic(
    () => import('@/components/wallet/transaction-history'),
    { ssr: false }
);

export const LazyAddMoneyModal = dynamic(
    () => import('@/components/wallet/add-money-modal').then(mod => ({ default: mod.AddMoneyModal })),
    { ssr: false }
);

/**
 * Chart Components - Heavy visualization libraries
 */
export const LazySavingsBreakdown = dynamic(
    () => import('@/components/savings-breakdown').then(mod => ({ default: mod.SavingsBreakdown })),
    { ssr: false }
);

export const LazyAchievements = dynamic(
    () => import('@/components/achievements').then(mod => ({ default: mod.Achievements })),
    { ssr: false }
);

/**
 * Modal Components - Load only when opened
 */
export const LazyPaymentMethodsModal = dynamic(
    () => import('@/components/payments/manage-payment-methods').then(mod => ({ default: mod.ManagePaymentMethods })),
    { ssr: false }
);

/**
 * Admin Components - Load only for admin users
 */
export const LazyAdminDashboard = dynamic(
    () => import('@/components/admin/dashboard'),
    { ssr: false }
);

/**
 * Heavy Third-Party Component Wrappers
 */
export const LazyRichTextEditor = dynamic(
    () => import('@/components/ui/rich-text-editor'),
    { ssr: false }
);

/**
 * Conditionally Rendered Features
 */
export const LazyBiometricSetup = dynamic(
    () => import('@/components/biometric-setup'),
    { ssr: false }
);

/**
 * Usage Example:
 * 
 * // Instead of:
 * import { EditProfile } from '@/components/profile/edit-profile';
 * 
 * // Use:
 * import { LazyEditProfile } from '@/lib/lazy-components';
 * 
 * // Then in component:
 * <LazyEditProfile />
 */

/**
 * Component Size Guidelines:
 * - < 50KB: Load normally
 * - 50-100KB: Consider lazy loading for non-critical paths
 * - > 100KB: Always lazy load
 * 
 * Check bundle size: npm run build && npm run analyze
 */
