# Initialize Sandbox2 Wallet - Quick Guide

## Problem
The $5 referral bonus is not being credited because the **sandbox2 wallet doesn't exist** in your database yet.

## Solution
Call the admin API endpoint to create the sandbox2 wallet with $10,000 initial balance.

## Steps to Initialize

### Option 1: Using Browser/Postman

1. **Login to admin panel** first at `http://localhost:3001/login`
2. **Get your admin token** from localStorage or cookies
3. **Make POST request** to:
   ```
   POST http://localhost:5000/api/admin/init-sandbox2
   ```
   
   **Headers**:
   ```
   Authorization: Bearer YOUR_ADMIN_TOKEN
   Content-Type: application/json
   ```

### Option 2: Using cURL (PowerShell)

```powershell
# First, login and get token
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/auth/login" `
  -Method POST `
  -Body '{"email":"your-admin@email.com","password":"your-password"}' `
  -ContentType "application/json"

$token = $response.data.accessToken

# Then initialize sandbox2
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/init-sandbox2" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -ContentType "application/json"
```

### Option 3: Direct Database Insert (MongoDB Compass)

If you have MongoDB Compass:

1. Connect to your database
2. Go to `wallets` collection
3. Insert this document:

```json
{
  "userId": "sandbox2",
  "balance": 10000,
  "availableBalance": 10000,
  "locked": 0,
  "lockedInPockets": 0,
  "referralEarnings": 0,
  "currentStreak": 0,
  "dailySavingAmount": 0,
  "status": "active",
  "createdAt": "2026-02-11T00:00:00.000Z",
  "updatedAt": "2026-02-11T00:00:00.000Z"
}
```

## Verification

After initialization, check:

```
GET http://localhost:5000/api/admin/init-sandbox2
```

Should return:
```json
{
  "success": true,
  "message": "Sandbox2 wallet already exists",
  "data": {
    "userId": "sandbox2",
    "balance": 10000,
    "availableBalance": 10000
  }
}
```

## Test Referral Bonus

After sandbox2 is initialized:

1. **Get referral code** from existing user
2. **Sign up new account** with referral code
3. **Verify email** (check inbox or use test endpoint)
4. **Check new user's wallet** - should show **$5.00**!

## Monitor Logs

Watch backend console for:
```
✅ $5 bonus → newuser@email.com
```

## Troubleshooting

**If bonus still doesn't work:**

1. Check sandbox2 balance:
   ```
   GET /api/admin/wallets/sandbox2
   ```

2. Check backend logs for errors:
   ```
   Bonus error: [error details]
   ```

3. Verify email verification is calling the bonus code:
   - Add console.log before the referral bonus check
   - Ensure `user.referredBy` exists

---

**Quick Test Command** (after getting admin token):

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/init-sandbox2" `
  -Method POST `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"}
```

```bash
# Bash/Linux
curl -X POST http://localhost:5000/api/admin/init-sandbox2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Status After This**: ✅ Ready for referral bonuses!
