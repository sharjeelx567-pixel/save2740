import { useEffect, useState, useCallback } from 'react';
import { AutoDebit } from '@/lib/types/payment';

interface UseAutoDebitReturn {
  autoDebits: AutoDebit[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing auto-debits
 * Auto-fetches every 30 seconds with cleanup
 */
export function useAutoDebit(): UseAutoDebitReturn {
  const [autoDebits, setAutoDebits] = useState<AutoDebit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutoDebits = useCallback(async () => {
    try {
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/payments/auto-debit', {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch auto-debits');
      }

      const data = await response.json();

      if (data.success) {
        setAutoDebits(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch auto-debits');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch auto-debits');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutoDebits();

    // Set up polling
    const interval = setInterval(fetchAutoDebits, 30000);

    // Handle window focus
    const handleFocus = () => {
      fetchAutoDebits();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAutoDebits]);

  return {
    autoDebits,
    loading,
    error,
    refetch: fetchAutoDebits,
  };
}
