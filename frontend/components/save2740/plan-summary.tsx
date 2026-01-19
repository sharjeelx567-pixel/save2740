'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, TrendingUp, Zap } from 'lucide-react';

interface PlanSummaryProps {
  planName: string;
  description?: string;
  savingsMode: 'daily' | 'weekly';
  dailyAmount?: number;
  weeklyAmount?: number;
  targetAmount: number;
  startDate: string;
  targetCompletionDate: string;
  onConfirm: () => void;
  onBack: () => void;
}

export function PlanSummary({
  planName,
  description,
  savingsMode,
  dailyAmount,
  weeklyAmount,
  targetAmount,
  startDate,
  targetCompletionDate,
  onConfirm,
  onBack,
}: PlanSummaryProps) {
  const amount = savingsMode === 'daily' ? dailyAmount : weeklyAmount;
  const frequency = savingsMode === 'daily' ? 'per day' : 'per week';
  const monthlyEquivalent = savingsMode === 'daily' ? 
    (dailyAmount! * 365 / 12).toFixed(2) : 
    (weeklyAmount! * 52 / 12).toFixed(2);
  
  const daysDiff = Math.ceil(
    (new Date(targetCompletionDate).getTime() - new Date(startDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="w-full max-w-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-bold">Plan Summary</h3>
      </div>

      <div className="space-y-4 mb-4">
        {/* Plan Name and Target */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <h4 className="font-bold text-lg mb-2">{planName}</h4>
          {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
          <p className="text-3xl font-bold text-blue-600">${(targetAmount / 100).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Target Amount</p>
        </div>

        {/* Savings Rate */}
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Savings Rate</p>
            <p className="text-lg font-bold text-orange-600">${(amount! / 100).toFixed(2)} {frequency}</p>
            <p className="text-xs text-gray-500">~${monthlyEquivalent}/month</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Timeline</p>
            <p className="text-lg font-bold text-blue-600">{daysDiff} days</p>
            <p className="text-xs text-gray-500">
              {new Date(startDate).toLocaleDateString()} → {new Date(targetCompletionDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Frequency Badge */}
        <div>
          <p className="text-sm font-semibold mb-2">Savings Frequency</p>
          <Badge className="bg-green-100 text-brand-green capitalize">
            {savingsMode} contributions
          </Badge>
        </div>

        {/* Quick Facts */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Days</p>
            <p className="font-bold text-lg">{daysDiff}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Contributions</p>
            <p className="font-bold text-lg">
              {savingsMode === 'daily' ? daysDiff : Math.ceil(daysDiff / 7)}
            </p>
          </div>
        </div>
      </div>

      <Alert className="mb-4 bg-green-50 border-green-200">
        <TrendingUp className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-700">
          You're on track to reach your goal in approximately {daysDiff} days!
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Confirm Plan
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        You can pause, adjust, or cancel this plan at any time
      </p>
    </Card>
  );
}
