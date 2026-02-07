/**
 * Payment Service
 * Frontend service for handling all payment-related operations
 */

import { apiClient } from '../api-client';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  paymentDate: string;
  description: string;
}

export interface Transaction {
  transactionId: string;
  userId: string;
  type: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

/**
 * Create a payment intent for wallet top-up
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd'
): Promise<PaymentIntent> {
  const response = await apiClient.post('/payments/intent', {
    amount,
    currency
  });

  if (!response.success) {
    throw new Error(getErrorMessage(response.error, 'Failed to create payment intent'));
  }

  return response.data;
}

/**
 * Get all payment receipts for current user
 */
export async function getPaymentReceipts(
  page: number = 1,
  limit: number = 20
): Promise<{ receipts: PaymentReceipt[]; pagination: any }> {
  const response = await apiClient.get(`/payments/receipts?page=${page}&limit=${limit}`);

  if (!response.success) {
    throw new Error(getErrorMessage(response.error, 'Failed to get receipts'));
  }

  return {
    receipts: response.data,
    pagination: response.pagination
  };
}

/**
 * Get specific payment receipt by receipt number
 */
export async function getPaymentReceipt(
  receiptNumber: string
): Promise<PaymentReceipt> {
  const response = await apiClient.get(`/payments/receipts/${receiptNumber}`);

  if (!response.success) {
    throw new Error(getErrorMessage(response.error, 'Failed to get receipt'));
  }

  return response.data;
}

/**
 * Get receipt as HTML (for printing/viewing)
 */
export function getReceiptHtmlUrl(receiptNumber: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  return `${baseUrl}/api/payments/receipts/${receiptNumber}/html?token=${token}`;
}

/**
 * Download receipt as PDF (opens in new tab for printing)
 */
export function downloadReceipt(receiptNumber: string): void {
  const url = getReceiptHtmlUrl(receiptNumber);
  window.open(url, '_blank');
}

/**
 * Retry a failed payment
 */
export async function retryFailedPayment(
  transactionId: string,
  paymentMethodId?: string
): Promise<PaymentIntent> {
  const response = await apiClient.post(`/payments/${transactionId}/retry`, {
    paymentMethodId
  });

  if (!response.success) {
    throw new Error(getErrorMessage(response.error, 'Failed to retry payment'));
  }

  return response.data;
}

/**
 * Get payment history
 */
export async function getPaymentHistory(
  page: number = 1,
  limit: number = 50,
  status?: string
): Promise<{ payments: Transaction[]; total: number; pagination: any }> {
  let url = `/payments?page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }

  const response = await apiClient.get(url);

  if (!response.success) {
    throw new Error(getErrorMessage(response.error, 'Failed to get payment history'));
  }

  return {
    payments: response.data,
    total: response.total || 0,
    pagination: response.pagination
  };
}

/**
 * Get auto-debit configuration
 */
export async function getAutoDebitConfig(): Promise<{
  enabled: boolean;
  amount: number;
  frequency: string;
  paymentMethodId: string | null;
  nextDebitDate: string;
}> {
  const response = await apiClient.get('/payments/auto-debit');

  if (!response.success) {
    throw new Error(getErrorMessage(response.error, 'Failed to get auto-debit config'));
  }

  return response.data;
}

/**
 * Update auto-debit configuration
 */
export async function updateAutoDebitConfig(config: {
  enabled: boolean;
  amount: number;
  frequency: string;
  paymentMethodId: string;
}): Promise<any> {
  const response = await apiClient.post('/payments/auto-debit', config);

  if (!response.success) {
    throw new Error(getErrorMessage(response.error, 'Failed to update auto-debit config'));
  }

  return response.data;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get payment status badge color
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'green';
    case 'pending':
    case 'processing':
      return 'yellow';
    case 'failed':
    case 'declined':
      return 'red';
    case 'cancelled':
      return 'gray';
    default:
      return 'blue';
  }
}

/**
 * Get payment status display text
 */
export function getStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}



