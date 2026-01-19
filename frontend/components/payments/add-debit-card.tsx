'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { DebitCard } from '@/lib/types/payment';

interface AddDebitCardProps {
  onSuccess?: (card: DebitCard) => void;
}

export function AddDebitCard({ onSuccess }: AddDebitCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debitCard, setDebitCard] = useState<DebitCard | null>(null);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    displayName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      billingAddress: { ...prev.billingAddress, [name]: value },
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'country') {
      setFormData((prev) => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, country: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const validateForm = () => {
    if (!formData.cardholderName) {
      setError('Cardholder name is required');
      return false;
    }
    const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      setError('Valid card number required');
      return false;
    }
    if (!formData.expiryMonth || !formData.expiryYear) {
      setError('Expiry date is required');
      return false;
    }
    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      setError('Valid CVV required (3-4 digits)');
      return false;
    }
    if (!formData.displayName) {
      setError('Display name is required');
      return false;
    }
    if (!formData.billingAddress.street || !formData.billingAddress.city || !formData.billingAddress.state || !formData.billingAddress.zip) {
      setError('Complete billing address is required');
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
      const response = await fetch('/api/payments/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          ...formData,
          expiryMonth: parseInt(formData.expiryMonth),
          expiryYear: parseInt(formData.expiryYear),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to add debit card');
        toast({
          title: 'Error',
          description: data.error || 'Failed to add debit card',
          variant: 'destructive',
        });
        return;
      }

      setDebitCard(data.data);
      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Debit card added successfully',
      });

      if (onSuccess) {
        onSuccess(data.data);
      }
    } catch (err) {
      const errorMsg = 'Failed to add debit card. Please try again.';
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

  if (success && debitCard) {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Card Added Successfully</h3>
        </div>

        <div className="bg-gradient-to-r from-brand-green to-green-700 text-white rounded-lg p-4 mb-4">
          <p className="text-sm opacity-75 mb-2">Card Number</p>
          <p className="font-mono text-lg tracking-widest mb-4">•••• •••• •••• {debitCard.last4}</p>
          <div className="flex justify-between">
            <div>
              <p className="text-xs opacity-75">Cardholder</p>
              <p className="font-semibold">{debitCard.cardholderName}</p>
            </div>
            <div>
              <p className="text-xs opacity-75">Expires</p>
              <p className="font-semibold">{debitCard.expiryMonth}/{debitCard.expiryYear.toString().slice(-2)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div>
            <p className="text-sm text-green-700">Card Name</p>
            <p className="font-semibold text-green-900">{debitCard.displayName}</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Brand</p>
            <p className="font-semibold text-green-900 capitalize">{debitCard.brand}</p>
          </div>
        </div>

        <Button onClick={() => setSuccess(false)} className="w-full bg-green-600 hover:bg-green-700">
          Add Another Card
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-6 h-6" />
        <h3 className="text-xl font-bold">Add Debit Card</h3>
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="cardholderName">Cardholder Name</Label>
          <Input
            id="cardholderName"
            name="cardholderName"
            placeholder="John Doe"
            value={formData.cardholderName}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            name="cardNumber"
            placeholder="4111 1111 1111 1111"
            value={formatCardNumber(formData.cardNumber)}
            onChange={(e) => setFormData((prev) => ({ ...prev, cardNumber: e.target.value }))}
            disabled={loading}
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="expiryMonth">Month</Label>
            <Select value={formData.expiryMonth} onValueChange={(value) => handleSelectChange('expiryMonth', value)}>
              <SelectTrigger>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expiryYear">Year</Label>
            <Select value={formData.expiryYear} onValueChange={(value) => handleSelectChange('expiryYear', value)}>
              <SelectTrigger>
                <SelectValue placeholder="YYYY" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() + i).toString()).map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              name="cvv"
              placeholder="123"
              value={formData.cvv}
              onChange={handleInputChange}
              disabled={loading}
              maxLength={4}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="displayName">Card Name</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="My Visa Card"
            value={formData.displayName}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Billing Address</h4>

          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              name="street"
              placeholder="123 Main Street"
              value={formData.billingAddress.street}
              onChange={handleAddressChange}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="New York"
                value={formData.billingAddress.city}
                onChange={handleAddressChange}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                placeholder="NY"
                value={formData.billingAddress.state}
                onChange={handleAddressChange}
                disabled={loading}
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                name="zip"
                placeholder="10001"
                value={formData.billingAddress.zip}
                onChange={handleAddressChange}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={formData.billingAddress.country} onValueChange={(value) => handleSelectChange('country', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Card...
            </>
          ) : (
            'Add Debit Card'
          )}
        </Button>
      </form>

      <Alert className="mt-4 bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-brand-green" />
        <AlertDescription className="text-sm text-brand-green/80">
          Your card information is encrypted and PCI-DSS compliant. We never store your full card number.
        </AlertDescription>
      </Alert>
    </Card>
  );
}
