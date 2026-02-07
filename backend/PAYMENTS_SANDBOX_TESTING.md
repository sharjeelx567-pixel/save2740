# Save2740 Payments System - Sandbox Testing Guide

Complete guide for testing the Save2740 payments system using Stripe Test Mode.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Stripe Setup](#stripe-setup)
- [Environment Configuration](#environment-configuration)
- [Test Cards](#test-cards)
- [Testing Scenarios](#testing-scenarios)
- [Webhook Testing](#webhook-testing)
- [Admin Panel Testing](#admin-panel-testing)
- [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before you begin testing, ensure you have:

1. **Stripe Account** (Test Mode)
   - Create a free account at [https://stripe.com](https://stripe.com)
   - No credit card required for test mode

2. **Development Environment**
   - Node.js (v18+)
   - MongoDB instance
   - Backend server running on http://localhost:5000
   - Frontend running on http://localhost:3000

3. **Tools**
   - Postman or similar API testing tool
   - Stripe CLI (optional but recommended)

---

## 🔐 Stripe Setup

### Step 1: Get Your API Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** in the top right
3. Click **API Keys**
4. Copy your **Test Mode** keys:
   - **Publishable Key**: `pk_test_...` (for frontend)
   - **Secret Key**: `sk_test_...` (for backend)

⚠️ **IMPORTANT**: Never commit real API keys to version control!

### Step 2: Create Webhook Endpoint

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL:
   - **Local Testing**: `http://localhost:5000/api/webhooks/stripe`
   - **Staging**: `https://your-staging-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
   - `charge.refunded`
5. Click **Add Endpoint**
6. Copy the **Signing Secret** (`whsec_...`)

### Step 3: Install Stripe CLI (Optional but Recommended)

For local webhook testing:

```bash
# Install Stripe CLI
# Mac
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to `.env`:

```bash
cd backend
cp .env.example .env
```

2. Update the `.env` file with your Stripe test keys:

```env
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

3. Start the backend server:

```bash
npm run dev
```

---

## 💳 Test Cards

Stripe provides test card numbers to simulate different scenarios:

### Successful Payments

| Card Number | Brand | Scenario |
|-------------|-------|----------|
| 4242 4242 4242 4242 | Visa | Success |
| 5555 5555 5555 4444 | Mastercard | Success |
| 3782 822463 10005 | American Express | Success |
| 6011 1111 1111 1117 | Discover | Success |

### Failed Payments

| Card Number | Scenario |
|-------------|----------|
| 4000 0000 0000 0002 | Card Declined |
| 4000 0000 0000 9995 | Insufficient Funds |
| 4000 0000 0000 0069 | Expired Card |
| 4000 0000 0000 0127 | Incorrect CVC |
| 4000 0000 0000 0119 | Processing Error |

### Special Cases

| Card Number | Scenario |
|-------------|----------|
| 4000 0025 0000 3155 | Requires Authentication (3D Secure) |
| 4000 0000 0000 9979 | Charge Disputed - Fraudulent |

### Card Details for All Test Cards

- **Expiration Date**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP Code**: Any 5 digits (e.g., 12345)

---

## 🧪 Testing Scenarios

### 1. Wallet Top-Up (Deposit)

**Scenario**: User adds money to their wallet.

```bash
# Step 1: Create Payment Intent
POST http://localhost:5000/api/payments/intent
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "usd"
}

# Response
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxxxxxxxxxxxx",
    "amount": 100.00,
    "currency": "usd"
  }
}

# Step 2: Confirm Payment (Frontend - Stripe.js)
# Use clientSecret with Stripe.js confirmCardPayment()

# Step 3: Check Wallet Balance
GET http://localhost:5000/api/wallet
Authorization: Bearer YOUR_JWT_TOKEN

# Expected: Balance increased by $100.00
```

**What to Verify**:
- ✅ Payment intent created successfully
- ✅ Webhook received (`payment_intent.succeeded`)
- ✅ Wallet balance updated
- ✅ Transaction record created
- ✅ Ledger entries created (double-entry)
- ✅ Receipt generated automatically

---

### 2. Failed Payment

**Scenario**: User attempts payment with declined card.

```bash
# Use declined test card: 4000 0000 0000 0002
# Follow same steps as Wallet Top-Up

# Expected Result:
# - Payment fails
# - Webhook received (payment_intent.payment_failed)
# - Transaction marked as 'failed'
# - Wallet balance unchanged
# - No ledger entries created
```

---

### 3. Retry Failed Payment

**Scenario**: User retries a failed payment.

```bash
POST http://localhost:5000/api/payments/FAILED_TRANSACTION_ID/retry
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "paymentMethodId": "pm_card_visa"
}

# Response
{
  "success": true,
  "message": "Payment retry initiated",
  "data": {
    "transaction": { ... },
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxxxxxxxxxxxx"
  }
}
```

---

### 4. Get Payment Receipt

**Scenario**: User retrieves payment receipt.

```bash
# Get all receipts
GET http://localhost:5000/api/payments/receipts
Authorization: Bearer YOUR_JWT_TOKEN

# Get specific receipt
GET http://localhost:5000/api/payments/receipts/RCP-2024-001234
Authorization: Bearer YOUR_JWT_TOKEN

# Get receipt as HTML
GET http://localhost:5000/api/payments/receipts/RCP-2024-001234/html
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### 5. Admin: View All Payments

**Scenario**: Admin views all payments in the system.

```bash
GET http://localhost:5000/api/admin/payments?status=completed&page=1&limit=50
Authorization: Bearer ADMIN_JWT_TOKEN

# Response
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    },
    "stats": [
      { "_id": "completed", "count": 120, "totalAmount": 45000 },
      { "_id": "pending", "count": 20, "totalAmount": 8000 },
      { "_id": "failed", "count": 10, "totalAmount": 0 }
    ]
  }
}
```

---

### 6. Admin: Refund Payment

**Scenario**: Admin processes a refund for a completed payment.

```bash
POST http://localhost:5000/api/admin/payments/TXN-ABC123/refund
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "amount": 50.00,
  "reason": "Customer requested refund"
}

# Response
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refundTransaction": { ... },
    "refundId": "re_xxxxxxxxxxxxx"
  }
}
```

**What to Verify**:
- ✅ Refund processed in Stripe
- ✅ Webhook received (`charge.refunded`)
- ✅ Wallet balance decreased
- ✅ Refund transaction created
- ✅ Negative ledger entry recorded
- ✅ Audit log created

---

### 7. Admin: Payment Statistics

**Scenario**: Admin views payment statistics.

```bash
GET http://localhost:5000/api/admin/payments/stats?period=30d
Authorization: Bearer ADMIN_JWT_TOKEN

# Response
{
  "success": true,
  "data": {
    "period": "30d",
    "overall": {
      "totalTransactions": 500,
      "totalAmount": 150000,
      "successfulCount": 450,
      "successfulAmount": 145000,
      "failedCount": 50,
      "pendingCount": 0
    },
    "byType": [...],
    "daily": [...],
    "topUsers": [...]
  }
}
```

---

## 🔔 Webhook Testing

### Local Testing with Stripe CLI

1. Start your backend server:
```bash
npm run dev
```

2. In a new terminal, start Stripe CLI forwarding:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

3. Trigger a test webhook:
```bash
# Success
stripe trigger payment_intent.succeeded

# Failed
stripe trigger payment_intent.payment_failed

# Refund
stripe trigger charge.refunded
```

### Manual Webhook Testing

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click on your endpoint
3. Click **Send Test Webhook**
4. Select event type
5. Click **Send Test Webhook**

### Verify Webhook Processing

```bash
# Check webhook events in database
GET http://localhost:5000/api/admin/webhooks/events
Authorization: Bearer ADMIN_JWT_TOKEN

# Expected:
# - All webhooks logged with status
# - No duplicate processing (idempotency)
# - Failed webhooks with error messages
```

---

## 🧑‍💼 Admin Panel Testing

### Admin Dashboard

1. **Login as Admin**
```bash
POST http://localhost:5000/api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@save2740.com",
  "password": "admin_password"
}
```

2. **View Payment Dashboard**
   - Navigate to: `http://localhost:3001/admin/payments`
   - Should see:
     - Total payment volume
     - Success rate
     - Failed payments
     - Pending payments
     - Charts and graphs

3. **Search and Filter Payments**
   - Filter by status (completed, pending, failed)
   - Filter by date range
   - Filter by user
   - Filter by amount range

4. **Process Refunds**
   - Click on a completed payment
   - Click "Issue Refund"
   - Enter amount (full or partial)
   - Enter reason
   - Confirm refund

5. **View Wallet Balances**
   - Navigate to: `http://localhost:3001/admin/wallets`
   - View all user wallet balances
   - View total system balance

---

## 🐛 Troubleshooting

### Webhook Not Received

**Problem**: Payments succeed but wallet not updated.

**Solutions**:
1. Check webhook secret is correct in `.env`
2. Verify webhook endpoint is accessible
3. Check server logs for webhook errors
4. Use Stripe CLI to forward webhooks locally
5. Check firewall/network settings

### Payment Fails with "No such payment_intent"

**Problem**: Payment intent not found.

**Solutions**:
1. Verify you're using the correct Stripe keys (test vs live)
2. Check payment intent was created successfully
3. Verify payment intent ID is correct
4. Check if payment intent expired (24 hours)

### Duplicate Webhooks Processing

**Problem**: Wallet credited twice for same payment.

**Solutions**:
1. Check webhook idempotency is working
2. Verify WebhookEvent model is saving correctly
3. Check database indexes on webhook events
4. Review webhook processing logs

### Stripe Test Card Not Working

**Problem**: Test card returns error.

**Solutions**:
1. Verify you're in test mode (using `sk_test_` key)
2. Check card number is exactly as documented
3. Use any future expiry date
4. Use any 3-digit CVC
5. Clear browser cache/cookies

### Refund Fails

**Problem**: Refund request returns error.

**Solutions**:
1. Verify payment is in "succeeded" status
2. Check refund amount <= original payment amount
3. Verify payment was made within last 120 days
4. Check Stripe account has sufficient balance
5. Review Stripe dashboard for more details

---

## 📊 Test Checklist

Use this checklist to ensure comprehensive testing:

### User Flows
- [ ] User can add payment method
- [ ] User can deposit funds to wallet
- [ ] User receives payment receipt
- [ ] User can view transaction history
- [ ] User can retry failed payments
- [ ] User receives email confirmation (if enabled)

### Payment Processing
- [ ] Successful payments update wallet
- [ ] Failed payments don't update wallet
- [ ] Pending payments show correct status
- [ ] Refunds decrease wallet balance
- [ ] Partial refunds work correctly

### Webhooks
- [ ] payment_intent.succeeded updates wallet
- [ ] payment_intent.payment_failed updates transaction
- [ ] charge.refunded creates refund transaction
- [ ] Duplicate webhooks are ignored (idempotency)
- [ ] Failed webhook processing is logged

### Ledger & Accounting
- [ ] Double-entry ledger created for deposits
- [ ] Double-entry ledger created for refunds
- [ ] Ledger balances match wallet balances
- [ ] Negative balance prevention works

### Admin Functions
- [ ] Admin can view all payments
- [ ] Admin can filter payments
- [ ] Admin can view payment details
- [ ] Admin can process refunds
- [ ] Admin can view wallet balances
- [ ] Admin can view payment statistics
- [ ] Admin actions are audit logged

### Security
- [ ] Webhook signatures are verified
- [ ] JWT authentication required for all endpoints
- [ ] Admin-only endpoints protected
- [ ] No card details stored in database
- [ ] Payment limits enforced

---

## 🚀 Next Steps

After successful sandbox testing:

1. **Staging Environment**
   - Deploy to staging with test keys
   - Test with team members
   - Verify webhook delivery from Stripe servers

2. **Production Preparation**
   - Complete Stripe account verification
   - Switch to live API keys
   - Update webhook endpoints to production URLs
   - Enable monitoring and alerts
   - Set up error tracking (Sentry)

3. **Go Live Checklist**
   - [ ] Live Stripe keys configured
   - [ ] Webhooks configured for production
   - [ ] SSL certificate active (HTTPS)
   - [ ] Backup and disaster recovery tested
   - [ ] Customer support process defined
   - [ ] Refund policy documented
   - [ ] Legal compliance verified (PCI-DSS via Stripe)

---

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [PCI Compliance](https://stripe.com/docs/security/guide)

---

## 💬 Support

For questions or issues:

- **Development Team**: dev@save2740.com
- **Stripe Support**: https://support.stripe.com
- **Documentation**: [Project Wiki/Docs]

---

**Last Updated**: January 30, 2026
**Version**: 1.0.0
