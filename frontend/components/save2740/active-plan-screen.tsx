import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Loader2,
  Pause,
  Play,
  Trash2,
  TrendingUp,
  Zap,
  Calendar,
  CheckCircle,
  AlertCircle,
  Target,
  DollarSign,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlanCompletedCelebration } from './plan-completed-celebration';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Save2740Plan {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  savingsMode: 'daily' | 'weekly';
  dailyAmount?: number;
  weeklyAmount?: number;
  totalTargetAmount: number;
  currentBalance: number;
  startDate: string;
  targetCompletionDate: string;
  estimatedCompletionDate?: string;
  contributionCount: number;
  daysActive: number;
  streakDays: number;
  longestStreak: number;
  nextContributionDate?: string;
  autoFund: boolean;
}

interface ActivePlanScreenProps {
  planId: string;
  onPlanUpdated?: () => void;
}

export function ActivePlanScreen({ planId, onPlanUpdated }: ActivePlanScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // React Query for fetching plan
  const {
    data: plan,
    isLoading: loading,
    refetch: refetchPlan
  } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const response = await apiClient.get<Save2740Plan>(`/api/save2740/${planId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.error || 'Failed to load plan');
      }
      return response.data;
    },
    enabled: !!planId,
    staleTime: 30000,
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'cancel' | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Helper to invalidate queries after mutation
  const invalidatePlan = () => {
    queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    queryClient.invalidateQueries({ queryKey: ['wallet'] }); // Update wallet as well possibly
    onPlanUpdated?.();
  };

  const handlePause = async () => {
    setActionLoading(true);
    setActionType('pause');
    try {
      const response = await apiClient.post(`/api/save2740/pause`, { planId });
      if (response.success) {
        toast.success('Plan paused successfully');
        invalidatePlan();
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to pause plan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause plan');
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    setActionType('resume');
    try {
      const response = await apiClient.post(`/api/save2740/resume`, { planId });
      if (response.success) {
        toast.success('Plan resumed successfully');
        invalidatePlan();
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to resume plan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume plan');
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const handleCancel = async (withdrawBalance: boolean = false) => {
    setActionLoading(true);
    setActionType('cancel');
    try {
      const response = await apiClient.post(`/api/save2740/cancel`, {
        planId,
        reason: 'User requested cancellation',
        withdrawBalance
      });
      if (response.success) {
        toast.success('Plan cancelled successfully');
        router.push('/save2740');
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to cancel plan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel plan');
    } finally {
      setActionLoading(false);
      setActionType(null);
      setShowCancelConfirm(false);
    }
  };

  const handleRestart = async () => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(`/api/save2740/restart`, { planId });
      if (response.success && response.data) {
        toast.success('Plan restarted successfully');
        router.push(`/save2740/active?id=${response.data._id}`);
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to restart plan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to restart plan');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Plan not found</p>
      </Card>
    );
  }

  // Show celebration if completed
  if (plan.status === 'completed') {
    return (
      <div className="space-y-6">
        <PlanCompletedCelebration
          completionData={{
            planName: plan.name,
            totalSaved: plan.currentBalance,
            targetAmount: plan.totalTargetAmount,
            daysToComplete: plan.daysActive,
            totalContributions: plan.contributionCount,
            longestStreak: plan.longestStreak || plan.streakDays,
            achievements: [
              {
                badge: '🎯',
                title: 'Goal Achiever',
                description: 'Successfully reached your savings target!'
              },
              {
                badge: '🔥',
                title: 'Streak Master',
                description: `Maintained a ${plan.longestStreak || plan.streakDays} day streak!`
              }
            ],
            nextPlanSuggestions: [
              {
                name: 'Emergency Fund',
                reason: 'Build a 6-month emergency fund',
                suggestedAmount: 10000
              },
              {
                name: 'Vacation Fund',
                reason: 'Save for your dream vacation',
                suggestedAmount: 5000
              }
            ]
          }}
          onRestart={handleRestart}
          onCreateNew={() => router.push('/save2740/create')}
        />
      </div>
    );
  }

  const progressPercent = plan.totalTargetAmount > 0
    ? (plan.currentBalance / plan.totalTargetAmount) * 100
    : 0;
  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(plan.targetCompletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ));
  const amount = plan.savingsMode === 'daily' ? (plan.dailyAmount || 0) : (plan.weeklyAmount || 0);
  const frequency = plan.savingsMode === 'daily' ? 'day' : 'week';

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {plan.status === 'paused' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Your plan is paused. Tap resume to continue saving.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              {plan.description && <p className="text-sm text-slate-600 mt-1">{plan.description}</p>}
            </div>
            <Badge
              className={
                plan.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : plan.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-brand-green text-white'
              }
            >
              {plan.status.toUpperCase()}
            </Badge>
          </div>

          {/* Target Amount */}
          <div className="bg-gradient-to-r from-brand-green/10 to-brand-green/5 rounded-lg p-4 mb-4 border border-brand-green/20">
            <p className="text-sm text-slate-600 mb-1">Target Amount</p>
            <p className="text-3xl font-bold text-brand-green">
              ${plan.totalTargetAmount.toFixed(2)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-slate-700">Progress</p>
              <p className="text-sm font-bold text-brand-green">{Math.round(progressPercent)}%</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-brand-green h-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-slate-600">
                ${plan.currentBalance.toFixed(2)} saved
              </p>
              <p className="text-sm text-slate-600">
                ${(plan.totalTargetAmount - plan.currentBalance).toFixed(2)} remaining
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-600" />
                <p className="text-xs text-slate-600">Savings Rate</p>
              </div>
              <p className="font-bold text-slate-900">${amount.toFixed(2)}/{frequency}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-brand-green" />
                <p className="text-xs text-slate-600">Days Left</p>
              </div>
              <p className="font-bold text-slate-900">{daysRemaining} days</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-slate-600">Contributions</p>
              </div>
              <p className="font-bold text-slate-900">{plan.contributionCount}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <p className="text-xs text-slate-600">Streak</p>
              </div>
              <p className="font-bold text-slate-900">🔥 {plan.streakDays} days</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-600 mb-2 font-semibold">Timeline</p>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Started:</strong> {new Date(plan.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Target Completion:</strong> {new Date(plan.targetCompletionDate).toLocaleDateString()}
              </p>
              {plan.nextContributionDate && (
                <p className="text-brand-green">
                  <strong>Next Contribution:</strong> {new Date(plan.nextContributionDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Auto-fund Alert */}
          {plan.autoFund && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-brand-green" />
              <AlertDescription className="text-sm text-brand-green/80">
                Auto-fund is enabled. Your account will be automatically debited for this plan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2">
        {plan.status === 'active' && (
          <>
            <Button
              onClick={handlePause}
              disabled={actionLoading}
              variant="outline"
              className="w-full"
            >
              {actionLoading && actionType === 'pause' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pausing...
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Plan
                </>
              )}
            </Button>

            {!showCancelConfirm ? (
              <Button
                onClick={() => setShowCancelConfirm(true)}
                disabled={actionLoading}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Plan
              </Button>
            ) : (
              <Card className="p-4 border-red-200 bg-red-50">
                <p className="text-sm font-semibold text-red-900 mb-2">Cancel Plan?</p>
                <p className="text-xs text-red-700 mb-4">
                  This will cancel your plan. You can choose to withdraw your saved balance or keep it locked.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleCancel(false)}
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Cancel & Keep Balance
                  </Button>
                  <Button
                    onClick={() => handleCancel(true)}
                    disabled={actionLoading}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Cancel & Withdraw Balance
                  </Button>
                  <Button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={actionLoading}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Keep Plan
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {plan.status === 'paused' && (
          <Button
            onClick={handleResume}
            disabled={actionLoading}
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white"
          >
            {actionLoading && actionType === 'resume' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Plan
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

