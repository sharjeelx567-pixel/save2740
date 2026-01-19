'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { BankAccount } from '@/lib/types/payment';

interface AddBankAccountProps {
  onSuccess?: (account: BankAccount) => void;
}

export function AddBankAccount({ onSuccess }: AddBankAccountProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    displayName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.accountHolderName) {
      setError('Account holder name is required');
      return false;
    }
    if (!formData.routingNumber || formData.routingNumber.length !== 9) {
      setError('Valid 9-digit routing number required');
      return false;
    }
    if (!formData.accountNumber || formData.accountNumber.length < 8) {
      setError('Valid account number required (8+ digits)');
      return false;
    }
    if (!formData.displayName) {
      setError('Display name is required');
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
      const response = await fetch('/api/payments/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to add bank account');
        toast({
          title: 'Error',
          description: data.error || 'Failed to add bank account',
          variant: 'destructive',
        });
        return;
      }

      setBankAccount(data.data);
      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Bank account added successfully',
      });

      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (err) {
      const errorMsg = 'Failed to add bank account. Please try again.';
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

  if (success && bankAccount) {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Bank Account Added</h3>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm text-green-700">Account Name</p>
            <p className="font-semibold text-green-900">{bankAccount.displayName}</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Bank</p>
            <p className="font-semibold text-green-900">{bankAccount.bankName}</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Account Type</p>
            <p className="font-semibold text-green-900 capitalize">{bankAccount.accountType}</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Status</p>
            <p className="font-semibold text-yellow-600 capitalize">Pending Verification</p>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200 mb-4">
          <AlertCircle className="h-4 w-4 text-brand-green" />
          <AlertDescription className="text-brand-green/80">
            We'll send two small deposits to verify this account. This usually takes 1-2 business days.
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => setSuccess(false)}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Add Another Account
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6">
      <h3 className="text-xl font-bold mb-4">Add Bank Account</h3>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="accountHolderName">Account Holder Name</Label>
          <Input
            id="accountHolderName"
            name="accountHolderName"
            placeholder="John Doe"
            value={formData.accountHolderName}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="accountType">Account Type</Label>
          <Select value={formData.accountType} onValueChange={(value) => handleSelectChange('accountType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Checking</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="money-market">Money Market</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="routingNumber">Routing Number</Label>
          <Input
            id="routingNumber"
            name="routingNumber"
            placeholder="123456789"
            maxLength={9}
            value={formData.routingNumber}
            onChange={handleInputChange}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">9-digit routing number</p>
        </div>

        <div>
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            placeholder="123456789"
            value={formData.accountNumber}
            onChange={handleInputChange}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">8-17 digit account number</p>
        </div>

        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="My Checking Account"
            value={formData.displayName}
            onChange={handleInputChange}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">How to identify this account</p>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Account...
            </>
          ) : (
            'Add Bank Account'
          )}
        </Button>
      </form>

      <Alert className="mt-4 bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-brand-green" />
        <AlertDescription className="text-sm text-brand-green/80">
          Your bank information is encrypted and secured by industry-standard security measures.
        </AlertDescription>
      </Alert>
    </Card>
  );
}
