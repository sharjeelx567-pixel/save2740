import { useEffect, useState, useCallback } from 'react';
import { Save2740Plan } from '@/lib/types/save2740';

interface UseSave2740PlanReturn {
  plan: Save2740Plan | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  progressPercent: number;
  daysRemaining: number;
}

/**
 * Custom hook for managing Save2740 plan
 * Auto-fetches every 10 seconds for real-time progress updates
 */
export function useSave2740Plan(planId: string): UseSave2740PlanReturn {
  const [plan, setPlan] = useState<Save2740Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/save2740?id=${planId}`, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }

      const data = await response.json();

      if (data.success) {
        setPlan(data.data);
      } else {
        setError(data.error || 'Failed to fetch plan');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch plan');
      }
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();

    // Set up polling for real-time updates
    const interval = setInterval(fetchPlan, 10000);

    // Handle window focus
    const handleFocus = () => {
      fetchPlan();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPlan]);

  const progressPercent = plan ? (plan.currentBalance / plan.totalTargetAmount) * 100 : 0;
  const daysRemaining = plan
    ? Math.ceil(
        (new Date(plan.targetCompletionDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return {
    plan,
    loading,
    error,
    refetch: fetchPlan,
    progressPercent,
    daysRemaining,
  };
}
