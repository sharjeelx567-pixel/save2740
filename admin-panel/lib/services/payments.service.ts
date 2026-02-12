/**
 * Admin Payments Service
 * Handles all payment-related operations for admin panel
 */

import { api } from '../api';

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get all payments with filters
 */
export async function getPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await api.get(`/admin/payments?${params.toString()}`);
  return response.data;
}

/**
 * Get payment statistics
 */
export async function getPaymentStats(period: string = '30d') {
  const response = await api.get(`/admin/payments/stats?period=${period}`);
  return response.data;
}

/**
 * Get specific payment details
 */
export async function getPaymentDetails(transactionId: string) {
  const response = await api.get(`/admin/payments/${transactionId}`);
  return response.data;
}


/**
 * Approve a pending payout/withdrawal
 */
export async function approvePayment(
  transactionId: string,
  approvalData: { notes?: string }
) {
  const response = await api.post(
    `/admin/payments/${transactionId}/approve`,
    approvalData
  );
  return response.data;
}

/**
 * Reject a pending payout/withdrawal
 */
export async function rejectPayment(
  transactionId: string,
  rejectionData: { reason: string }
) {
  const response = await api.post(
    `/admin/payments/${transactionId}/reject`,
    rejectionData
  );
  return response.data;
}

/**
 * Process refund for a payment
 */
export async function refundPayment(
  transactionId: string,
  refundData: { amount?: number; reason: string }
) {
  const response = await api.post(
    `/admin/payments/${transactionId}/refund`,
    refundData
  );
  return response.data;
}

/**
 * Get payment disputes
 */
export async function getPaymentDisputes() {
  const response = await api.get('/admin/payments/disputes/list');
  return response.data;
}

/**
 * Get all wallet balances
 */
export async function getWalletBalances(page: number = 1, limit: number = 50) {
  const response = await api.get(
    `/admin/payments/wallets/balances?page=${page}&limit=${limit}`
  );
  return response.data;
}

/**
 * Export payments to CSV
 */
export async function exportPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  // In a real implementation, this would trigger a download
  const response = await api.get(`/admin/payments/export?${params.toString()}`);
  return response;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get payment status badge color
 */
export function getPaymentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'success';
    case 'pending':
    case 'processing':
      return 'warning';
    case 'failed':
    case 'declined':
      return 'error';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Calculate payment success rate
 */
export function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100);
}

/**
 * Calculate average transaction value
 */
export function calculateAverageTransactionValue(
  totalAmount: number,
  totalTransactions: number
): number {
  if (totalTransactions === 0) return 0;
  return totalAmount / totalTransactions;
}
