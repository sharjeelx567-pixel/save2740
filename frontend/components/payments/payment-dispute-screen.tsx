'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, FileUp, CheckCircle } from 'lucide-react';
import { PaymentDispute } from '@/lib/types/payment';

interface PaymentDisputeScreenProps {
  transactionId: string;
  amount: number;
  merchantName: string;
  onDispute?: (dispute: PaymentDispute) => void;
}

export function PaymentDisputeScreen({
  transactionId,
  amount,
  merchantName,
  onDispute,
}: PaymentDisputeScreenProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'reason' | 'details' | 'evidence' | 'confirmation'>('reason');
  const [submitted, setSubmitted] = useState(false);
  const [dispute, setDispute] = useState<PaymentDispute | null>(null);

  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidence: [] as { file: File; type: string }[],
  });

  const reasonOptions = [
    { value: 'unauthorized', label: 'Unauthorized Transaction', description: 'I did not authorize this charge' },
    { value: 'duplicate', label: 'Duplicate Charge', description: 'I was charged multiple times' },
    { value: 'fraudulent', label: 'Fraudulent Activity', description: 'This appears to be fraud' },
    { value: 'service-issue', label: 'Service Issue', description: 'Service was not provided as promised' },
    { value: 'billing-error', label: 'Billing Error', description: 'I was charged the wrong amount' },
    {
      value: 'product-not-received',
      label: 'Product Not Received',
      description: 'I never received the product',
    },
  ];

  const handleReasonSelect = (reason: string) => {
    setFormData((prev) => ({ ...prev, reason }));
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          transactionId,
          reason: formData.reason,
          description: formData.description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDispute(data.data);
        setSubmitted(true);
        setStep('confirmation');

        toast({
          title: 'Success',
          description: 'Dispute filed successfully',
        });

        if (onDispute) {
          onDispute(data.data);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to file dispute',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to file dispute',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted && dispute) {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Dispute Filed</h3>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm text-green-700">Dispute ID</p>
            <p className="font-mono font-bold text-lg text-green-900">{dispute.id}</p>
          </div>

          <div>
            <p className="text-sm text-green-700">Status</p>
            <Badge className="bg-yellow-100 text-yellow-800 mt-1">
              {dispute.status.toUpperCase()}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-green-700">Amount in Dispute</p>
            <p className="text-2xl font-bold text-green-600">${(dispute.amount / 100).toFixed(2)}</p>
          </div>

          <div>
            <p className="text-sm text-green-700">Deadline</p>
            <p className="font-semibold">{new Date(dispute.deadline).toLocaleDateString()}</p>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-brand-green" />
          <AlertDescription className="text-sm text-brand-green/80">
            We'll investigate your dispute and keep you updated via email. Most disputes are resolved within 30 days.
          </AlertDescription>
        </Alert>

        <Button className="w-full bg-green-600 hover:bg-green-700">
          Return to Transactions
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6">
      <h3 className="text-xl font-bold mb-2">File a Dispute</h3>
      <p className="text-sm text-gray-600 mb-4">
        Transaction with {merchantName} for ${(amount / 100).toFixed(2)}
      </p>

      {step === 'reason' && (
        <div className="space-y-3">
          <p className="font-semibold mb-4">Select the reason for your dispute:</p>
          {reasonOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleReasonSelect(option.value)}
              className="w-full text-left p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition"
            >
              <p className="font-semibold text-sm">{option.label}</p>
              <p className="text-xs text-gray-600 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      )}

      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Badge className="bg-green-100 text-brand-green mb-3 capitalize">
              {formData.reason?.replace('-', ' ')}
            </Badge>

            <Label htmlFor="description" className="block mb-2">
              Detailed Explanation
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what happened..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-24"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Provide as much detail as possible</p>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-700">
              You'll be able to upload supporting evidence on the next step.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('reason')}
              disabled={loading}
            >
              Back
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-brand-green hover:bg-brand-green/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Filing...
                </>
              ) : (
                'File Dispute'
              )}
            </Button>
          </div>
        </form>
      )}

      <Alert className="mt-4 bg-green-50 border-green-200">
        <AlertTriangle className="h-4 w-4 text-brand-green" />
        <AlertDescription className="text-xs text-brand-green/80">
          Filing a dispute may lock your account temporarily while we investigate.
        </AlertDescription>
      </Alert>
    </Card>
  );
}
