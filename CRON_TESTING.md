# Cron Job Testing Guide

## Overview
This guide explains how to test all automated cron jobs in the Save2740 application during development.

## Available Cron Jobs

### 1. **Daily Savings Automation** 
- **Schedule**: Midnight (00:00) every day
- **Purpose**: Processes internal ledger allocations for all users
- **Test**: `POST /api/cron-test/daily-savings`

### 2. **Withdrawal Processing**
- **Schedule**: 2 AM every day
- **Purpose**: Processes scheduled withdrawals and ACH payouts
- **Test**: `POST /api/cron-test/withdrawal-processing`

### 3. **Low Balance Alerts**
- **Schedule**: 10 AM every day
- **Purpose**: Sends proactive alerts to users with low wallet balance
- **Test**: `POST /api/cron-test/low-balance-alerts`

### 4. **Monthly Reports**
- **Schedule**: 1st of every month at 9 AM
- **Purpose**: Generates and sends monthly savings reports
- **Test**: `POST /api/cron-test/monthly-reports`

### 5. **Referral Bonus Processing**
- **Schedule**: 3 AM every day
- **Purpose**: Credits referral bonuses for users who completed their first week
- **Test**: `POST /api/cron-test/referral-bonuses`

### 6. **Weekly Funding Reminders**
- **Schedule**: Every Monday at 9 AM
- **Purpose**: Reminds users to fund their wallet for the week
- **Test**: `POST /api/cron-test/funding-reminders`

### 7. **Streak Recovery Reminders**
- **Schedule**: 8 PM every day
- **Purpose**: Sends reminders to users who haven't saved yet today
- **Test**: `POST /api/cron-test/streak-reminders`

### 8. **Session Cleanup**
- **Schedule**: 4 AM every day
- **Purpose**: Cleans up expired sessions, tokens, and stale data
- **Test**: `POST /api/cron-test/cleanup`

### 9. **Transaction Sync**
- **Schedule**: Every 15 minutes
- **Purpose**: Syncs pending Stripe transactions and updates statuses
- **Test**: `POST /api/cron-test/transaction-sync`

---

## Testing Methods

### Method 1: Interactive PowerShell Script (Easiest)
```powershell
cd "b:\save 2740 app"
.\test-cron-jobs.ps1
```

Then select the job you want to test from the menu.

### Method 2: Direct API Calls (via PowerShell)
```powershell
# Example: Test Daily Savings
Invoke-RestMethod -Uri "http://localhost:5000/api/cron-test/daily-savings" -Method POST

# Example: Test Referral Bonuses
Invoke-RestMethod -Uri "http://localhost:5000/api/cron-test/referral-bonuses" -Method POST

# Check Status of All Jobs
Invoke-RestMethod -Uri "http://localhost:5000/api/cron-test/status" -Method GET
```

### Method 3: Using curl (Command Line)
```bash
# Example: Test Daily Savings
curl -X POST http://localhost:5000/api/cron-test/daily-savings

# Example: Check Status
curl http://localhost:5000/api/cron-test/status
```

### Method 4: Using Postman or Thunder Client (VS Code Extension)
1. Open Postman or Thunder Client
2. Create a new POST request
3. URL: `http://localhost:5000/api/cron-test/<job-name>`
4. Send the request

---

## Checking Results

After triggering a cron job:

1. **Check Console Output**: The backend terminal will show logs
2. **Check Database**: Verify changes in MongoDB
3. **Check Notifications**: If the job sends notifications, check the notifications table
4. **Check Wallet**: For jobs that modify balances, check the wallet table

---

## Example: Testing Referral Bonuses

```powershell
# 1. Run the PowerShell script
.\test-cron-jobs.ps1

# 2. Select option "5" for Referral Bonus Processing

# 3. Check the output in the terminal

# 4. Verify in the database:
# - Check if bonuses were credited to referrer wallets
# - Check if referral records were updated
# - Check transactions table for bonus entries
```

---

## Important Notes

⚠️ **Development Only**: These test endpoints are **only available in development** mode (`NODE_ENV !== 'production'`)

⚠️ **Real Actions**: These endpoints trigger **real** cron job logic. Data will actually be modified in your database.

⚠️ **Idempotency**: Most cron jobs are idempotent (safe to run multiple times), but be aware that running them multiple times may create duplicate alerts/notifications.

---

## Troubleshooting

### Issue: "Cannot find module"
**Solution**: The cron job utility file doesn't exist yet. Create it or comment out that job in `cron-scheduler.ts`

### Issue: "Connection timeout"
**Solution**: Make sure the backend server is running (`npm run dev` in the backend directory)

### Issue: "No changes observed"
**Solution**: Check the console output for error messages. The job may have run but found no data to process.

---

## Next Steps

1. Run `.\test-cron-jobs.ps1` to test your cron jobs
2. Monitor the backend console for detailed logs
3. Verify results in your database
4. Create test data if needed (e.g., create users with low balance for testing alerts)
