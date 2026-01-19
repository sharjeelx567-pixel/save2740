'use client';

import { useState, useEffect } from 'react';
import { StartSave2740 } from '@/components/save2740/start-save2740';
import { SelectSavingsMode } from '@/components/save2740/select-savings-mode';
import { PlanSummary } from '@/components/save2740/plan-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PlanFormState {
  name: string;
  description: string;
  targetAmount: number;
  savingsMode: 'daily' | 'weekly' | null;
  dailyAmount?: number;
  weeklyAmount?: number;
}

export default function CreateSave2740Page() {
  const [step, setStep] = useState<'start' | 'mode' | 'summary'>('start');
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
    const amounts = {
      dailyAmount: formData.savingsMode === 'daily' ? (formData.targetAmount / 365) : undefined,
      weeklyAmount: formData.savingsMode === 'weekly' ? (formData.targetAmount / 52) : undefined,
    };
    
    setFormData({
      ...formData,
      savingsMode: mode,
      ...(mode === 'daily' ? { dailyAmount: formData.targetAmount / 365 } : { weeklyAmount: formData.targetAmount / 52 }),
    });
    setStep('summary');
  };

  const handleCreatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const dailyAmount =
        formData.savingsMode === 'daily'
          ? formData.dailyAmount
          : (formData.weeklyAmount || 0) / 7;

      const response = await fetch('/api/save2740', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          planName: formData.name,
          description: formData.description,
          totalTargetAmount: formData.targetAmount,
          savingsMode: formData.savingsMode,
          dailySavingsAmount: dailyAmount,
          autoFund: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create plan');
      }

      const data = await response.json();

      if (data.success) {
        // Redirect to active plan
        window.location.href = `/save2740/active?id=${data.data.id}`;
      } else {
        setError(data.error || 'Failed to create plan');
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
          <p className="text-gray-600 mt-2">Step {step === 'start' ? 1 : step === 'mode' ? 2 : 3} of 3</p>
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
              onConfirm={handleCreatePlan}
              onBack={() => setStep('mode')}
            />
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep('mode')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCreatePlan}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-brand-green to-green-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Plan'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
