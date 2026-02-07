'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Star, CreditCard, Building2, AlertCircle } from 'lucide-react';
import { BankAccount, DebitCard, PaymentMethod } from '@/lib/types/payment';

interface ManagePaymentMethodsProps {
  onMethodSelected?: (method: PaymentMethod) => void;
}

export function ManagePaymentMethods({ onMethodSelected }: ManagePaymentMethodsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [debitCards, setDebitCards] = useState<DebitCard[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/methods', {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setBankAccounts(data.data.bankAccounts || []);
        setDebitCards(data.data.debitCards || []);
        setDefaultMethod(data.data.defaultMethod);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string, methodType: 'bank-account' | 'debit-card') => {
    try {
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ methodId, methodType }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Default payment method updated',
        });
        fetchPaymentMethods();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update default payment method',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      setDeleting(methodId);
      const response = await fetch(`/api/payments/bank-accounts`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Payment method removed',
        });
        fetchPaymentMethods();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove payment method',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (bankAccounts.length === 0 && debitCards.length === 0) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="font-semibold mb-2">No Payment Methods</h3>
        <p className="text-gray-600 mb-4">Add a bank account or debit card to get started</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Accounts */}
      {bankAccounts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Bank Accounts
          </h3>
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{account.displayName}</h4>
                      {defaultMethod?.id === account.id && (
                        <Badge className="bg-blue-100 text-blue-800 flex gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">{account.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Bank</p>
                        <p className="font-medium">{account.bankName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium capitalize">{account.accountType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Account</p>
                        <p className="font-mono">••••{account.accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Verification</p>
                        <p className="font-medium capitalize">{account.verificationStatus}</p>
                      </div>
                    </div>

                    {account.status === 'pending' && (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-3 w-3 text-yellow-600" />
                        <AlertDescription className="text-xs text-yellow-700">
                          Waiting for micro-deposit verification. Check your bank account for small deposits.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {defaultMethod?.id !== account.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(account.id, 'bank-account')}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleting === account.id}
                      onClick={() => handleDeleteMethod(account.id)}
                    >
                      {deleting === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Debit Cards */}
      {debitCards.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Debit Cards
          </h3>
          <div className="space-y-3">
            {debitCards.map((card) => (
              <Card key={card.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{card.displayName}</h4>
                      {defaultMethod?.id === card.id && (
                        <Badge className="bg-blue-100 text-blue-800 flex gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">{card.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Card Brand</p>
                        <p className="font-medium capitalize">{card.brand}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Card Number</p>
                        <p className="font-mono">•••• •••• •••• {card.last4}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expires</p>
                        <p className="font-medium">{card.expiryMonth}/{card.expiryYear.toString().slice(-2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cardholder</p>
                        <p className="font-medium">{card.cardholderName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {defaultMethod?.id !== card.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(card.id, 'debit-card')}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleting === card.id}
                      onClick={() => handleDeleteMethod(card.id)}
                    >
                      {deleting === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

