'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { AutoDebit } from '@/lib/types/payment';

interface AutoDebitConfirmationProps {
  autoDebit: AutoDebit;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function AutoDebitConfirmation({ autoDebit, onConfirm, onCancel }: AutoDebitConfirmationProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // In a real app, you'd send confirmation to backend
      setConfirmed(true);
      toast({
        title: 'Success',
        description: 'Auto-debit confirmed',
      });

      if (onConfirm) {
        onConfirm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm auto-debit',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Auto-Debit Confirmed</h3>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-green-700">
            Your auto-debit has been confirmed and is now active.
          </p>
          <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="font-semibold text-green-600">${(autoDebit.amount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Frequency</span>
              <span className="font-semibold capitalize">{autoDebit.frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Next Debit</span>
              <span className="font-semibold">{new Date(autoDebit.nextDebitDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200 mb-4">
          <Clock className="h-4 w-4 text-brand-green" />
          <AlertDescription className="text-sm text-brand-green/80">
            Check your email for confirmation details.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6">
      <h3 className="text-xl font-bold mb-2">Confirm Auto-Debit</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please review the details below and confirm your auto-debit setup.
      </p>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Amount</span>
          <span className="text-2xl font-bold text-blue-600">${(autoDebit.amount / 100).toFixed(2)}</span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Frequency</p>
              <Badge variant="outline" className="capitalize mt-1">{autoDebit.frequency}</Badge>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <Badge className="bg-green-100 text-green-800 mt-1">Active</Badge>
            </div>
            <div>
              <p className="text-gray-600">Purpose</p>
              <p className="font-semibold mt-1">{autoDebit.purpose}</p>
            </div>
            <div>
              <p className="text-gray-600">First Debit</p>
              <p className="font-semibold mt-1">{new Date(autoDebit.nextDebitDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4 text-brand-green" />
        <AlertDescription className="text-sm">
          Funds will be automatically withdrawn on the scheduled date from your selected payment method.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Auto-Debit'
          )}
        </Button>

        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          Cancel
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        You can manage or cancel this auto-debit anytime from your account settings.
      </p>
    </Card>
  );
}
