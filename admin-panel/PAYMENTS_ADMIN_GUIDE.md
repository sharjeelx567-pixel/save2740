# Save2740 Admin Panel - Payments Management Guide

Complete guide for managing payments in the Save2740 Admin Panel.

## 📋 Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Features](#features)
- [Pages](#pages)
- [Common Tasks](#common-tasks)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Admin Panel provides comprehensive payment management capabilities:

- **Read-Only Access**: View all payment transactions
- **Wallet Management**: Monitor user wallet balances
- **Refund Processing**: Issue full or partial refunds
- **Analytics**: View payment statistics and trends
- **Audit Trail**: Track all payment events and changes

---

## ⚙️ Setup

### 1. Environment Variables

Add to `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Admin Authentication
NEXT_PUBLIC_ADMIN_SECRET=your_admin_secret_here
```

### 2. Navigation

The payments section is accessible from the sidebar:

- **Payments** → `/payments`
- **Wallet Balances** → `/payments/wallets`
- **Payment Stats** → `/payments/stats`

---

## ✨ Features

### 1. View All Payments

**Location**: `/payments`

**Capabilities**:
- View all transactions across all users
- Filter by status, type, date range
- Pagination support (50 per page)
- Real-time statistics

**Filters Available**:
- **Status**: All, Completed, Pending, Failed, Cancelled
- **Type**: All, Deposit, Withdrawal, Refund, Fee
- **Date Range**: Start date and end date
- **User**: Search by user ID

### 2. Payment Details

**Location**: `/payments/[transactionId]`

**Information Displayed**:
- Transaction details (ID, amount, status)
- User information
- Payment receipt
- Webhook events
- Current wallet balance
- Timeline of events

**Actions Available**:
- Issue refund (for completed deposits)
- View user profile
- View related transactions

### 3. Wallet Balances

**Location**: `/payments/wallets`

**Capabilities**:
- View all user wallet balances
- See breakdown (Available, Locked, Escrow)
- Monitor wallet status (Active, Frozen, Suspended)
- System-wide balance totals

**Balance Types**:
- **Total Balance**: Overall wallet balance
- **Available**: Funds ready for use
- **Locked**: Funds in savings/pockets
- **Escrow**: Funds in pending transactions

### 4. Payment Statistics

**Location**: `/payments/stats`

**Analytics Available**:
- Overall performance metrics
- Success rate calculation
- Transaction breakdown by type
- Daily transaction trends
- Top users by volume

**Time Periods**:
- Last 7 days
- Last 30 days
- Last 90 days
- Last year

---

## 📖 Common Tasks

### Task 1: View Recent Payments

1. Navigate to **Payments** from sidebar
2. Payments are automatically sorted by date (newest first)
3. Use filters to narrow down results:
   - Select status: "Completed"
   - Click "Apply Filters"

### Task 2: Issue a Refund

1. Navigate to **Payments**
2. Find the payment to refund
3. Click "View Details"
4. Click "Issue Refund" button
5. Enter refund details:
   - **Amount**: Full or partial (max = original amount)
   - **Reason**: Required explanation
6. Click "Process Refund"
7. Confirm the action

**Important Notes**:
- Only completed deposits can be refunded
- Refunds are processed immediately via Stripe
- User wallet is updated automatically
- An audit log entry is created

### Task 3: Monitor User Wallet

1. Navigate to **Wallet Balances**
2. Find the user (search or browse)
3. Click "View User" to see full profile
4. Check balance breakdown:
   - Available funds
   - Locked funds
   - Escrow funds

### Task 4: Investigate Failed Payment

1. Navigate to **Payments**
2. Filter by Status: "Failed"
3. Click on the failed payment
4. Review:
   - Failure reason
   - Webhook events
   - User details
5. Contact user if needed

### Task 5: Export Payment Data

1. Navigate to **Payments**
2. Apply desired filters
3. Click "Export" button (top right)
4. Data is downloaded as CSV

### Task 6: View Payment Trends

1. Navigate to **Payment Stats**
2. Select time period (7d, 30d, 90d, 1y)
3. Review:
   - Overall performance
   - Transaction types
   - Daily trends
   - Top users

---

## 🔒 Security

### Admin Authentication

All payment endpoints require admin authentication:

```typescript
// Automatic in Admin Panel
const token = localStorage.getItem('adminToken');
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Role-Based Access

- **View Payments**: All admins
- **Issue Refunds**: Admin role only
- **Export Data**: Admin role only

### Audit Logging

All admin actions are logged:
- Payment views
- Refunds issued
- Data exports
- Filter changes

View audit logs at `/logs`

### Data Privacy

- Card details are **never** stored
- Only last 4 digits displayed
- PCI compliance through Stripe
- GDPR compliant data handling

---

## 🛡 Best Practices

### 1. Regular Monitoring

- Check payment stats daily
- Monitor failed payment rate
- Review pending transactions
- Watch for unusual patterns

### 2. Refund Guidelines

- Always provide clear reason
- Document refund requests
- Verify payment is legitimate
- Check for duplicate refunds

### 3. Security Practices

- Never share admin credentials
- Log out when not in use
- Review audit logs regularly
- Report suspicious activity

### 4. Customer Support

When handling payment issues:
1. Verify user identity
2. Check payment status
3. Review webhook events
4. Check wallet balance
5. Issue refund if appropriate
6. Document the resolution

---

## 🐛 Troubleshooting

### Payment Not Showing

**Issue**: Recent payment not visible in list.

**Solutions**:
1. Refresh the page
2. Clear filters
3. Check if payment is in different status
4. Wait 30 seconds for webhook processing
5. Check webhook events on backend

### Refund Button Disabled

**Issue**: Cannot issue refund for a payment.

**Possible Reasons**:
- Payment status is not "completed"
- Payment type is not "deposit"
- Payment already refunded
- Insufficient admin permissions

**Solution**: Check payment details for eligibility

### Statistics Not Loading

**Issue**: Payment stats page shows loading spinner.

**Solutions**:
1. Check internet connection
2. Verify API is running
3. Check browser console for errors
4. Try different time period
5. Clear browser cache

### Wallet Balance Mismatch

**Issue**: Wallet balance doesn't match expected value.

**Investigation Steps**:
1. Check all transactions for user
2. Review ledger entries
3. Check for pending transactions
4. Verify webhook processing
5. Contact backend team if inconsistent

### Export Not Working

**Issue**: CSV export fails or downloads empty file.

**Solutions**:
1. Reduce date range
2. Remove some filters
3. Check browser download settings
4. Try different browser
5. Check admin permissions

---

## 📊 Key Metrics to Monitor

### Daily

- [ ] Total transaction volume
- [ ] Failed payment rate
- [ ] Pending payment count
- [ ] Refund requests

### Weekly

- [ ] Success rate trend
- [ ] Average transaction value
- [ ] Top users by volume
- [ ] Transaction type distribution

### Monthly

- [ ] Revenue trends
- [ ] Refund rate
- [ ] User growth vs transactions
- [ ] System-wide wallet balance

---

## 🚨 Alerts to Watch For

### High Priority

- Success rate < 90%
- Pending payments > 50
- Failed payments spike
- Unusual refund activity

### Medium Priority

- Large transactions (> $1000)
- Multiple refunds from same user
- Wallet balance anomalies
- Webhook processing delays

### Low Priority

- Slow payment processing
- Minor UI issues
- Filter performance
- Export delays

---

## 📞 Support

For technical issues:

- **Backend Team**: backend@save2740.com
- **Frontend Team**: frontend@save2740.com
- **Stripe Support**: https://support.stripe.com

For questions about this guide:

- **Documentation**: docs@save2740.com

---

## 🔄 Updates

This guide is updated regularly. Check for:

- New features
- API changes
- Security updates
- Best practices

**Last Updated**: January 30, 2026
**Version**: 1.0.0
