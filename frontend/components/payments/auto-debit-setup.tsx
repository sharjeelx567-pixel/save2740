'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { AutoDebit } from '@/lib/types/payment';

interface AutoDebitSetupProps {
  paymentMethods: any[];
  onSuccess?: (autoDebit: AutoDebit) => void;
}

export function AutoDebitSetup({ paymentMethods, onSuccess }: AutoDebitSetupProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autoDebit, setAutoDebit] = useState<AutoDebit | null>(null);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    paymentMethodId: '',
    amount: '',
    frequency: 'monthly',
    startDate: '',
    dayOfMonth: '1',
    purpose: '',
    maxRetries: '3',
    notificationPreference: 'email',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.paymentMethodId) {
      setError('Payment method is required');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) < 1) {
      setError('Amount must be at least $1');
      return false;
    }
    if (parseFloat(formData.amount) > 1000) {
      setError('Amount cannot exceed $1,000');
      return false;
    }
    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (!formData.purpose) {
      setError('Purpose is required');
      return false;
    }
    if (formData.frequency === 'monthly' && (!formData.dayOfMonth || parseInt(formData.dayOfMonth) < 1 || parseInt(formData.dayOfMonth) > 31)) {
      setError('Valid day of month required (1-31)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/auto-debit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: Math.round(parseFloat(formData.amount) * 100),
          maxRetries: parseInt(formData.maxRetries),
          dayOfMonth: formData.frequency === 'monthly' ? parseInt(formData.dayOfMonth) : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to setup auto-debit');
        toast({
          title: 'Error',
          description: data.error || 'Failed to setup auto-debit',
          variant: 'destructive',
        });
        return;
      }

      setAutoDebit(data.data);
      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Auto-debit setup successfully',
      });

      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (err) {
      const errorMsg = 'Failed to setup auto-debit. Please try again.';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success && autoDebit) {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Auto-Debit Activated</h3>
        </div>

        <div className="space-y-3 mb-4">
          <div className="bg-white rounded p-3 border border-green-200">
            <p className="text-sm text-gray-600">Frequency</p>
            <p className="font-semibold capitalize">{autoDebit.frequency}</p>
          </div>
          <div className="bg-white rounded p-3 border border-green-200">
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-2xl font-bold text-green-600">${(autoDebit.amount / 100).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded p-3 border border-green-200">
            <p className="text-sm text-gray-600">First Debit</p>
            <p className="font-semibold">{new Date(autoDebit.nextDebitDate).toLocaleDateString()}</p>
          </div>
          <div className="bg-white rounded p-3 border border-green-200">
            <p className="text-sm text-gray-600">Purpose</p>
            <p className="font-semibold">{autoDebit.purpose}</p>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200 mb-4">
          <AlertCircle className="h-4 w-4 text-brand-green" />
          <AlertDescription className="text-brand-green/80 text-sm">
            You'll receive a {autoDebit.notificationPreference} reminder before each debit.
          </AlertDescription>
        </Alert>

        <Button onClick={() => setSuccess(false)} className="w-full bg-green-600 hover:bg-green-700">
          Setup Another Auto-Debit
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-brand-green" />
        <h3 className="text-xl font-bold">Auto-Debit Setup</h3>
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="paymentMethodId">Payment Method</Label>
          <Select value={formData.paymentMethodId} onValueChange={(value) => handleSelectChange('paymentMethodId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Amount (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-600">$</span>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="50.00"
              min="1"
              max="1000"
              step="0.01"
              value={formData.amount}
              onChange={handleInputChange}
              disabled={loading}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Between $1 and $1,000</p>
        </div>

        <div>
          <Label htmlFor="frequency">Frequency</Label>
          <Select value={formData.frequency} onValueChange={(value) => handleSelectChange('frequency', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.frequency === 'monthly' && (
          <div>
            <Label htmlFor="dayOfMonth">Day of Month</Label>
            <Select value={formData.dayOfMonth} onValueChange={(value) => handleSelectChange('dayOfMonth', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map((day) => (
                  <SelectItem key={day} value={day}>
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Input
            id="purpose"
            name="purpose"
            placeholder="e.g., Monthly Savings"
            value={formData.purpose}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="notificationPreference">Notifications</Label>
          <Select value={formData.notificationPreference} onValueChange={(value) => handleSelectChange('notificationPreference', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email Only</SelectItem>
              <SelectItem value="sms">SMS Only</SelectItem>
              <SelectItem value="both">Both Email & SMS</SelectItem>
              <SelectItem value="none">No Notifications</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Up...
            </>
          ) : (
            'Setup Auto-Debit'
          )}
        </Button>
      </form>

      <Alert className="mt-4 bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-brand-green" />
        <AlertDescription className="text-sm text-brand-green/80">
          You can pause or cancel auto-debits anytime from your account settings.
        </AlertDescription>
      </Alert>
    </Card>
  );
}
