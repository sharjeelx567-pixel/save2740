'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConfirmPlanProps {
  planName: string;
  targetAmount: number;
  savingsMode: 'daily' | 'weekly';
  amount: number;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export function ConfirmPlan({
  planName,
  targetAmount,
  savingsMode,
  amount,
  onConfirm,
  onBack,
  loading = false
}: ConfirmPlanProps) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-brand-green" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Confirm Your Plan</h3>
          <p className="text-sm text-slate-600">Review your plan details before confirming</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-600 mb-1">Plan Name</p>
            <p className="font-bold text-lg text-slate-900">{planName}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-600 mb-1">Target Amount</p>
            <p className="font-bold text-2xl text-brand-green">${targetAmount.toFixed(2)}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-600 mb-1">Savings Rate</p>
            <p className="font-bold text-lg text-slate-900">
              ${amount.toFixed(2)} {savingsMode === 'daily' ? 'per day' : 'per week'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">By confirming, you agree to:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Save ${amount.toFixed(2)} {savingsMode === 'daily' ? 'daily' : 'weekly'}</li>
                  <li>Reach your goal of ${targetAmount.toFixed(2)}</li>
                  <li>Maintain your savings commitment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200 mb-4">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-700">
            You can pause, resume, or cancel this plan at any time from your dashboard.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Confirm & Start Plan'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

