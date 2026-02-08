import { useEffect, useState, useCallback } from 'react';
import { PaymentMethod, BankAccount, DebitCard } from '@/lib/types/payment';

interface UsePaymentMethodsReturn {
  bankAccounts: BankAccount[];
  debitCards: DebitCard[];
  defaultMethod: PaymentMethod | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing payment methods
 * Auto-fetches every 30 seconds, with cleanup on unmount
 */
export function usePaymentMethods(): UsePaymentMethodsReturn {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [debitCards, setDebitCards] = useState<DebitCard[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in again');
      }

      const response = await fetch('/api/payment-methods', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();

      if (data.success) {
        // Handle V2 grouped data or flat list
        const methodsData = data.data?.data || data.data || [];
        if (Array.isArray(methodsData)) {
          setBankAccounts(methodsData.filter((m: any) => m.type === 'bank_account' || m.type === 'bank'));
          setDebitCards(methodsData.filter((m: any) => m.type === 'card' || m.type === 'debit'));
          setDefaultMethod(methodsData.find((m: any) => m.isDefault) || methodsData[0] || null);
        } else {
          setBankAccounts(data.data?.bankAccounts || []);
          setDebitCards(data.data?.debitCards || []);
          setDefaultMethod(data.data?.defaultMethod || null);
        }
      } else {
        setError(data.error || 'Failed to fetch payment methods');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch payment methods');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();

    // Set up polling
    const interval = setInterval(fetchPaymentMethods, 30000);

    // Handle window focus
    const handleFocus = () => {
      fetchPaymentMethods();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPaymentMethods]);

  return {
    bankAccounts,
    debitCards,
    defaultMethod,
    loading,
    error,
    refetch: fetchPaymentMethods,
  };
}
