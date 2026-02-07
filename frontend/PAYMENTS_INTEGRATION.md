# Save2740 Frontend - Payments Integration Guide

Complete guide for integrating Stripe payments in the Save2740 frontend.

## 📋 Table of Contents

- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Components](#components)
- [Services](#services)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## 🚀 Setup

### 1. Install Dependencies

Stripe dependencies are already installed:

```json
{
  "@stripe/react-stripe-js": "^2.9.0",
  "@stripe/stripe-js": "^3.5.0",
  "stripe": "^20.1.0"
}
```

If you need to install them:

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js stripe
```

### 2. Environment Variables

Create/update `.env.local`:

```env
# Stripe Public Key (Publishable Key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **IMPORTANT**: 
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Never use secret keys in frontend
- Use test keys (`pk_test_`) for development

---

## 🧩 Components

### StripeProvider

Wrap your app with StripeProvider in `layout.tsx` or `_app.tsx`:

```tsx
import { StripeProvider } from '@/components/payment/stripe-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StripeProvider>
          {children}
        </StripeProvider>
      </body>
    </html>
  );
}
```

### StripeCheckout Component

```tsx
import StripeCheckout from '@/components/payment/stripe-checkout';

function PaymentPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Get client secret from backend
  useEffect(() => {
    async function createIntent() {
      const intent = await createPaymentIntent(100.00);
      setClientSecret(intent.clientSecret);
    }
    createIntent();
  }, []);

  if (!clientSecret) {
    return <div>Loading...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckout
        amount={100.00}
        currency="USD"
        onSuccess={(paymentIntent) => {
          console.log('Payment succeeded:', paymentIntent);
          router.push('/wallet');
        }}
        onError={(error) => {
          console.error('Payment failed:', error);
        }}
      />
    </Elements>
  );
}
```

---

## 🔧 Services

### Payment Service

All payment-related API calls are handled by `lib/services/payment.service.ts`.

#### Create Payment Intent

```typescript
import { createPaymentIntent } from '@/lib/services/payment.service';

const intent = await createPaymentIntent(100.00, 'usd');
// Returns: { clientSecret, paymentIntentId, amount, currency }
```

#### Get Payment Receipts

```typescript
import { getPaymentReceipts } from '@/lib/services/payment.service';

const { receipts, pagination } = await getPaymentReceipts(1, 20);
```

#### Retry Failed Payment

```typescript
import { retryFailedPayment } from '@/lib/services/payment.service';

const intent = await retryFailedPayment('TXN-123', 'pm_card_visa');
```

#### Download Receipt

```typescript
import { downloadReceipt } from '@/lib/services/payment.service';

// Opens receipt in new tab for printing
downloadReceipt('RCP-2024-001234');
```

---

## 💡 Usage Examples

### Example 1: Simple Wallet Top-Up

```tsx
'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckout from '@/components/payment/stripe-checkout';
import { createPaymentIntent } from '@/lib/services/payment.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function WalletTopUp() {
  const [amount, setAmount] = useState<number>(50);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInitiatePayment = async () => {
    setLoading(true);
    try {
      const intent = await createPaymentIntent(amount);
      setClientSecret(intent.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripeCheckout
          amount={amount}
          onSuccess={() => {
            alert('Payment successful!');
            window.location.href = '/wallet';
          }}
          onError={(error) => {
            alert(`Payment failed: ${error}`);
            setClientSecret(null);
          }}
        />
      </Elements>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Money to Wallet</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (USD)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            min={1}
            step={0.01}
          />
        </div>
        <Button
          onClick={handleInitiatePayment}
          disabled={loading || amount < 1}
          className="w-full"
        >
          {loading ? 'Processing...' : `Add $${amount.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
```

### Example 2: Payment History with Receipts

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getPaymentHistory, downloadReceipt, formatCurrency, formatDate, getStatusColor } from '@/lib/services/payment.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const { payments } = await getPaymentHistory(1, 50);
        setPayments(payments);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  if (loading) {
    return <div>Loading payments...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Payment History</h1>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.transactionId}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{payment.description}</div>
              <div className="text-sm text-gray-500">
                {formatDate(payment.createdAt)}
              </div>
              <div className="text-sm">
                Transaction ID: {payment.transactionId}
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="text-lg font-bold">
                {formatCurrency(payment.amount)}
              </div>
              <Badge variant={getStatusColor(payment.status)}>
                {payment.status}
              </Badge>
              {payment.status === 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Assuming receipt number is in metadata
                    const receiptNumber = payment.metadata?.receiptNumber;
                    if (receiptNumber) {
                      downloadReceipt(receiptNumber);
                    }
                  }}
                >
                  View Receipt
                </Button>
              )}
              {payment.status === 'failed' && (
                <Button
                  size="sm"
                  onClick={async () => {
                    // Implement retry logic
                    const intent = await retryFailedPayment(payment.transactionId);
                    // Redirect to payment page with new intent
                  }}
                >
                  Retry Payment
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Auto-Debit Configuration

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getAutoDebitConfig, updateAutoDebitConfig } from '@/lib/services/payment.service';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function AutoDebitSettings() {
  const [config, setConfig] = useState({
    enabled: false,
    amount: 27.40,
    frequency: 'daily',
    paymentMethodId: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await getAutoDebitConfig();
        setConfig(data);
      } catch (error) {
        console.error('Error fetching auto-debit config:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      await updateAutoDebitConfig(config);
      alert('Auto-debit settings saved!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save settings');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Auto-Debit Settings</h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label>Enable Auto-Debit</label>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) =>
              setConfig({ ...config, enabled: checked })
            }
          />
        </div>

        {config.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount
              </label>
              <Input
                type="number"
                value={config.amount}
                onChange={(e) =>
                  setConfig({ ...config, amount: parseFloat(e.target.value) })
                }
                step={0.01}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <Select
                value={config.frequency}
                onValueChange={(value) =>
                  setConfig({ ...config, frequency: value })
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
          </>
        )}

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const intent = await createPaymentIntent(amount);
  setClientSecret(intent.clientSecret);
} catch (error: any) {
  // Show user-friendly error message
  if (error.message.includes('insufficient funds')) {
    alert('Insufficient funds. Please try a smaller amount.');
  } else {
    alert('Payment failed. Please try again later.');
  }
  
  // Log error for debugging
  console.error('Payment error:', error);
}
```

### 2. Loading States

Show loading indicators during async operations:

```tsx
const [loading, setLoading] = useState(false);

const handlePayment = async () => {
  setLoading(true);
  try {
    await createPaymentIntent(amount);
  } finally {
    setLoading(false);
  }
};
```

### 3. Success Feedback

Provide clear feedback on successful payments:

```tsx
onSuccess={(paymentIntent) => {
  // Show success message
  toast.success('Payment successful!');
  
  // Refresh wallet balance
  refreshWallet();
  
  // Redirect to confirmation page
  router.push('/payment/success');
}
```

### 4. Security

- **Never** store card details
- **Never** use secret keys in frontend
- Always use HTTPS in production
- Validate amounts on both frontend and backend
- Use Stripe's built-in fraud detection

### 5. Testing

Use Stripe test cards for development:

```typescript
// Success: 4242 4242 4242 4242
// Declined: 4000 0000 0000 0002
// Insufficient Funds: 4000 0000 0000 9995
```

### 6. Mobile Optimization

Ensure payment forms work well on mobile:

```tsx
<div className="max-w-md mx-auto p-4 md:p-6">
  {/* Payment form */}
</div>
```

---

## 🔒 Security Checklist

- [ ] Using HTTPS in production
- [ ] Stripe publishable key (not secret key) in frontend
- [ ] Environment variables properly configured
- [ ] Client-side validation implemented
- [ ] Error messages don't expose sensitive info
- [ ] Payment amounts validated on backend
- [ ] Webhook signature verification enabled
- [ ] PCI compliance through Stripe Elements

---

## 📱 Mobile Considerations

- Use responsive design
- Test on various screen sizes
- Optimize touch targets (buttons, inputs)
- Handle keyboard properly
- Test payment flow on real devices
- Consider mobile wallet integration (Apple Pay, Google Pay)

---

## 🐛 Troubleshooting

### "Stripe is not loaded"

**Solution**: Ensure StripeProvider wraps your component:

```tsx
<StripeProvider>
  <YourComponent />
</StripeProvider>
```

### "Invalid publishable key"

**Solution**: Check `.env.local` has correct key starting with `pk_test_` or `pk_live_`.

### "Payment failed with no error"

**Solution**: Check browser console and network tab for details. Verify webhook is receiving events.

### Card Details Not Appearing

**Solution**: Ensure `PaymentElement` is inside `Elements` component with `clientSecret`.

---

## 📚 Additional Resources

- [Stripe React Documentation](https://stripe.com/docs/stripe-js/react)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Elements](https://stripe.com/docs/payments/elements)
- [Testing in Stripe](https://stripe.com/docs/testing)

---

**Last Updated**: January 30, 2026
