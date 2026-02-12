
# Testing Admin Payout Approvals

This guide explains how to test the SuperAdmin payout approval workflow.

## 1. Prerequisites
- Ensure the backend and frontend are running.
- Ensure you have a SuperAdmin account and a standard User account.

## 2. Initiate a Withdrawal (as User)
Since the mobile app might not be running locally, you can simulate a withdrawal request using `curl` or Postman.

### Get User Token
First, log in as a user to get your `accessToken`.

```bash
# Login as user (replace with actual credentials)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```
*Copy the `accessToken` from the response.*

### Create Withdrawal Request
```bash
# Request a withdrawal
curl -X POST http://localhost:5000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "paymentMethodId": "pm_card_visa", 
    "reason": "Test Withdrawal"
  }'
```
*Note: Make sure the user has enough balance. If not, deposit some funds first via `/api/wallet/deposit`.*

## 3. Approve Withdrawal (as Admin)

### Log in to Admin Panel
1. Navigate to the Admin Panel (e.g., `http://localhost:3001`).
2. Log in with your SuperAdmin credentials.

### Locate the Transaction
1. Go to **Payments** (`/payments`).
2. Filter by **Type: Withdrawal** and **Status: Pending**.
3. You should see the withdrawal request you just created.

### Review and Approve
1. Click **View Details** on the transaction.
2. In the "Actions" card (right sidebar), you will see an **Approve Payout** button.
   - *Note: This button only appears for `pending` withdrawals.*
3. Click **Approve Payout**.
4. Enter any administrative notes and confirm.

### Verify
1. The transaction status should change to `completed`.
2. The user's wallet should reflect the deduction (if not already deducted during request) or the status update.
3. Check the **Audit Logs** (`/system/audit-logs`) to see the `APPROVE_PAYOUT` entry.

## 4. Reject Withdrawal (Alternative Path)
1. Follow steps 1-2 above.
2. Click **Reject Payout** instead.
3. Enter a rejection reason.
4. Verify that the transaction is marked `failed` (or `rejected`) and the funds are refunded to the user's wallet.
