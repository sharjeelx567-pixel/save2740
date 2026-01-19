'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { PaymentAuthorization } from '@/lib/types/payment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentAuthorizationScreenProps {
  authorization: PaymentAuthorization;
  onConfirm?: (confirmed: boolean) => void;
}

export function PaymentAuthorizationScreen({ authorization, onConfirm }: PaymentAuthorizationScreenProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [cvv, setCvv] = useState('');
  const [cvvError, setCvvError] = useState('');

  useEffect(() => {
    if (!authorization.requiresConfirmation) {
      setConfirmed(true);
    }
  }, [authorization]);

  const getRiskBadgeColor = () => {
    switch (authorization.riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirm = async () => {
    if (authorization.requiresConfirmation && !cvv) {
      setCvvError('CVV required for high-risk transactions');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/payments/authorize/${authorization.id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ confirmed: true, cvv }),
      });

      const data = await response.json();

      if (data.success) {
        setConfirmed(true);
        toast({
          title: 'Success',
          description: 'Payment authorized successfully',
        });

        if (onConfirm) {
          onConfirm(true);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to authorize payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payments/authorize/${authorization.id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ confirmed: false }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Cancelled',
          description: 'Payment authorization cancelled',
        });

        if (onConfirm) {
          onConfirm(false);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel authorization',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (confirmed && !authorization.requiresConfirmation) {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Payment Authorized</h3>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Authorization Code</p>
            <p className="font-mono font-bold text-lg">{authorization.authorizationCode}</p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-2xl font-bold text-green-600">
              ${(authorization.amount / 100).toFixed(2)} {authorization.currency}
            </p>
          </div>

          <div className="text-sm text-green-700">
            <p>Your payment has been authorized and will be processed shortly.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-6 h-6 text-brand-green" />
        <h3 className="text-xl font-bold">Authorize Payment</h3>
      </div>

      <div className="mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">Amount</p>
          <p className="text-3xl font-bold text-blue-600">
            ${(authorization.amount / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{authorization.currency}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-500">Merchant</p>
            <p className="text-sm font-semibold">{authorization.merchantName}</p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-500">Risk Level</p>
            <Badge className={`${getRiskBadgeColor()} mt-1`} variant="outline">
              {authorization.riskLevel.toUpperCase()}
            </Badge>
          </div>
        </div>

        {authorization.requiresConfirmation && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              This transaction requires additional verification. Please enter your CVV.
            </AlertDescription>
          </Alert>
        )}

        {authorization.riskLevel === 'high' && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-sm">
              This transaction has been flagged for security review. Verification required.
            </AlertDescription>
          </Alert>
        )}

        {authorization.requiresConfirmation && (
          <div className="mb-4">
            <Label htmlFor="cvv">CVV (Card Verification Value)</Label>
            <Input
              id="cvv"
              type="password"
              placeholder="123"
              value={cvv}
              onChange={(e) => {
                setCvv(e.target.value);
                setCvvError('');
              }}
              maxLength={4}
              disabled={loading}
            />
            {cvvError && <p className="text-xs text-red-600 mt-1">{cvvError}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authorizing...
              </>
            ) : (
              'Authorize Payment'
            )}
          </Button>

          <Button
            onClick={handleDecline}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Decline
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is encrypted and secure.
      </p>
    </Card>
  );
}
