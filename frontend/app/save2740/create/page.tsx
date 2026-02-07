'use client';

import { useState, useEffect } from 'react';
import { StartSave2740 } from '@/components/save2740/start-save2740';
import { SelectSavingsMode } from '@/components/save2740/select-savings-mode';
import { PlanSummary } from '@/components/save2740/plan-summary';
import { ConfirmPlan } from '@/components/save2740/confirm-plan';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface PlanFormState {
  name: string;
  description: string;
  targetAmount: number;
  savingsMode: 'daily' | 'weekly' | null;
  dailyAmount?: number;
  weeklyAmount?: number;
}

export default function CreateSave2740Page() {
  const [step, setStep] = useState<'start' | 'mode' | 'summary' | 'confirm'>('start');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormState>({
    name: '',
    description: '',
    targetAmount: 0,
    savingsMode: null,
  });

  const handleStartSubmit = (data: any) => {
    setFormData({
      ...formData,
      name: data.planName,
      description: data.description,
      targetAmount: parseFloat(data.targetAmount),
    });
    setStep('mode');
  };

  const handleModeSelect = (mode: 'daily' | 'weekly') => {
    setFormData({
      ...formData,
      savingsMode: mode,
      dailyAmount: mode === 'daily' ? formData.targetAmount / 365 : undefined,
      weeklyAmount: mode === 'weekly' ? formData.targetAmount / 52 : undefined,
    });
    setStep('summary');
  };

  const handleSummaryConfirm = () => {
    setStep('confirm');
  };

  const handleCreatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const dailyAmount =
        formData.savingsMode === 'daily'
          ? formData.dailyAmount
          : (formData.weeklyAmount || 0) / 7;

      const weeklyAmount =
        formData.savingsMode === 'weekly'
          ? formData.weeklyAmount
          : undefined;

      const response = await apiClient.post('/api/save2740', {
        planName: formData.name,
        description: formData.description,
        totalTargetAmount: formData.targetAmount,
        savingsMode: formData.savingsMode,
        dailySavingsAmount: dailyAmount,
        weeklySavingsAmount: weeklyAmount,
        autoFund: false,
      });

      if (response.success && response.data) {
        toast.success('Plan created successfully!');
        // Redirect to active plan
        setTimeout(() => {
          window.location.href = `/save2740/active?id=${response.data._id || response.data.id}`;
        }, 1000);
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to create plan');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Save2740 Plan</h1>
          <p className="text-gray-600 mt-2">Step {step === 'start' ? 1 : step === 'mode' ? 2 : step === 'summary' ? 3 : 4} of 4</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="mt-2">
              Dismiss
            </Button>
          </Card>
        )}

        {/* Step 1: Start */}
        {step === 'start' && <StartSave2740 onNext={handleStartSubmit} />}

        {/* Step 2: Select Mode */}
        {step === 'mode' && (
          <div>
            <SelectSavingsMode
              targetAmount={formData.targetAmount}
              planName={formData.name}
              onSelect={handleModeSelect}
            />
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep('start')} className="flex-1">
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 'summary' && (
          <div>
            <PlanSummary
              planName={formData.name}
              targetAmount={formData.targetAmount}
              savingsMode={formData.savingsMode!}
              dailyAmount={formData.dailyAmount}
              weeklyAmount={formData.weeklyAmount}
              startDate={new Date().toISOString().split('T')[0]}
              targetCompletionDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              onConfirm={handleSummaryConfirm}
              onBack={() => setStep('mode')}
            />
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && (
          <div>
            <ConfirmPlan
              planName={formData.name}
              targetAmount={formData.targetAmount}
              savingsMode={formData.savingsMode!}
              amount={formData.savingsMode === 'daily' ? (formData.dailyAmount || 0) : (formData.weeklyAmount || 0)}
              onConfirm={handleCreatePlan}
              onBack={() => setStep('summary')}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

