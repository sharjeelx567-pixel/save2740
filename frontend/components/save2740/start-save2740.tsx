'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Zap } from 'lucide-react';

interface StartSave2740Props {
  onNext?: (formData: any) => void;
}

export function StartSave2740({ onNext }: StartSave2740Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    planName: '',
    description: '',
    targetAmount: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.planName) {
      setError('Plan name is required');
      return false;
    }
    if (!formData.targetAmount || parseFloat(formData.targetAmount) < 100) {
      setError('Target amount must be at least $100');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onNext) {
        onNext(formData);
      }
    }, 500);
  };

  return (
    <Card className="w-full max-w-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-brand-green" />
        <h3 className="text-xl font-bold">Start Save2740 Plan</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Create your personalized savings plan and achieve your financial goals
      </p>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="planName">Plan Name</Label>
          <Input
            id="planName"
            name="planName"
            placeholder="e.g., Emergency Fund, Vacation, Home Down Payment"
            value={formData.planName}
            onChange={handleInputChange}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">Give your plan a memorable name</p>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Why are you saving? What will this money be used for?"
            value={formData.description}
            onChange={handleInputChange}
            disabled={loading}
            className="min-h-20"
          />
        </div>

        <div>
          <Label htmlFor="targetAmount">Target Amount (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-600">$</span>
            <Input
              id="targetAmount"
              name="targetAmount"
              type="number"
              placeholder="1000.00"
              min="100"
              step="0.01"
              value={formData.targetAmount}
              onChange={handleInputChange}
              disabled={loading}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum $100</p>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-brand-green" />
          <AlertDescription className="text-sm text-brand-green/80">
            Next, you'll choose how often to save (daily or weekly) and confirm your plan details.
          </AlertDescription>
        </Alert>

        <Button type="submit" disabled={loading} className="w-full bg-brand-green hover:bg-brand-green/90">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Continue to Next Step'
          )}
        </Button>
      </form>
    </Card>
  );
}
