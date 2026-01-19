'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { Save2740Plan } from '@/lib/types/save2740';

interface ActivePlanScreenProps {
  planId: string;
  onPlanUpdated?: (plan: Save2740Plan) => void;
}

export function ActivePlanScreen({ planId, onPlanUpdated }: ActivePlanScreenProps) {
  const { toast } = useToast();
  const [plan, setPlan] = useState<Save2740Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'cancel' | null>(null);

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/save2740?id=${planId}`, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPlan(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    setActionLoading(true);
    setActionType(action);

    try {
      const response = await fetch(`/api/save2740/${planId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setPlan(data.data);
        toast({
          title: 'Success',
          description: `Plan ${action}d successfully`,
        });

        if (onPlanUpdated) {
          onPlanUpdated(data.data);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || `Failed to ${action} plan`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} plan`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setActionType(null);
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

  const progressPercent = (plan.currentBalance / plan.totalTargetAmount) * 100;
  const daysRemaining = Math.ceil(
    (new Date(plan.targetCompletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const amount = plan.savingsMode === 'daily' ? plan.dailyAmount : plan.weeklyAmount;
  const frequency = plan.savingsMode === 'daily' ? 'day' : 'week';

  return (
    <div className="space-y-4">
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
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            {plan.description && <p className="text-sm text-gray-600">{plan.description}</p>}
          </div>
          <Badge
            className={
              plan.status === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }
          >
            {plan.status.toUpperCase()}
          </Badge>
        </div>

        {/* Target Amount */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Target Amount</p>
          <p className="text-3xl font-bold text-blue-600">
            ${(plan.totalTargetAmount / 100).toFixed(2)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold">Progress</p>
            <p className="text-sm font-bold text-brand-green">{Math.round(progressPercent)}%</p>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-600">
              ${(plan.currentBalance / 100).toFixed(2)} saved
            </p>
            <p className="text-sm text-gray-600">
              ${((plan.totalTargetAmount - plan.currentBalance) / 100).toFixed(2)} remaining
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-gray-600">Savings Rate</p>
            </div>
            <p className="font-bold">${(amount! / 100).toFixed(2)}/<br className="hidden sm:block" />{frequency}</p>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-brand-green" />
              <p className="text-xs text-gray-600">Days Left</p>
            </div>
            <p className="font-bold">{daysRemaining} days</p>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-600">Contributions</p>
            </div>
            <p className="font-bold">{plan.contributionCount}</p>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <p className="text-xs text-gray-600">Streak</p>
            </div>
            <p className="font-bold">🔥 {plan.streakDays} days</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-xs text-gray-600 mb-2">Timeline</p>
          <div className="space-y-1">
            <p className="text-sm">
              <strong>Started:</strong> {new Date(plan.startDate).toLocaleDateString()}
            </p>
            <p className="text-sm">
              <strong>Target Completion:</strong> {new Date(plan.targetCompletionDate).toLocaleDateString()}
            </p>
            {plan.estimatedCompletionDate && (
              <p className="text-sm text-green-600">
                <strong>Estimated:</strong> {new Date(plan.estimatedCompletionDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Settings Alert */}
        {plan.autoFund && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-brand-green" />
            <AlertDescription className="text-sm text-brand-green/80">
              Auto-fund is enabled. Your account will be automatically debited for this plan.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2">
        {plan.status === 'active' && (
          <>
            <Button
              onClick={() => handleAction('pause')}
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

            <Button
              onClick={() => handleAction('cancel')}
              disabled={actionLoading}
              variant="destructive"
              className="w-full"
            >
              {actionLoading && actionType === 'cancel' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Plan
                </>
              )}
            </Button>
          </>
        )}

        {plan.status === 'paused' && (
          <Button
            onClick={() => handleAction('resume')}
            disabled={actionLoading}
            className="w-full bg-green-600 hover:bg-green-700"
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
