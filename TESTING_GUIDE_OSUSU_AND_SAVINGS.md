# Testing Guide: Osusu Groups vs Saver Account

## Overview
Save2740 supports TWO distinct financial behaviors:
1. **Saver Account** - Individual savings (deposits & withdrawals)
2. **Osusu Groups** - Rotating group savings (contributions & payouts)

This guide shows how to test both features are working correctly and independently.

---

## Prerequisites

### Running Services
Ensure all three services are running:
```bash
# Terminal 1: Frontend
cd b:\save 2740 app\frontend
npm run dev  # http://localhost:3000

# Terminal 2: Backend
cd b:\save 2740 app\backend
npm run dev  # http://localhost:5000

# Terminal 3: Admin Panel
cd b:\save 2740 app\admin-panel
npm run dev  # http://localhost:3001
```

### Test Accounts Needed
You'll need **3 test user accounts** to properly test group functionality:
- User A (Group Owner)
- User B (Group Member)
- User C (Group Member)

---

## Part 1: Testing Saver Account (Individual Savings)

### Step 1: Create Test Account
1. Navigate to `http://localhost:3000/auth/signup`
2. Create account:
   - Email: `saver1@test.com`
   - Password: `Test1234!`
   - First Name: `Saver`
   - Last Name: `One`
3. Verify email (check console logs or use test mode)

### Step 2: Test Wallet Deposit (Savings)
1. Login at `http://localhost:3000/auth/login`
2. Navigate to `My Wallet` page (`/my-wallet`)
3. Click **"Add Money"** or navigate to `/add-money`
4. Add test deposit:
   ```
   Amount: $50.00
   Payment Method: Test Card
   ```
5. **Verify**:
   - ✅ Wallet balance increases
   - ✅ Transaction appears in history
   - ✅ Transaction type = "deposit"
   - ✅ Status = "completed"

### Step 3: Test Wallet Withdrawal (Savings)
1. On wallet page, click **"Withdraw"**
2. Create withdrawal:
   ```
   Amount: $10.00
   Account: Bank Account / Debit Card
   ```
3. **Verify**:
   - ✅ Wallet balance decreases
   - ✅ Transaction type = "withdrawal"
   - ✅ Status = "pending" or "completed"
   - ✅ User type should be "savings_only" (check admin panel)

### Step 4: Test Saver Pockets (Goals)
1. Navigate to `/saver-pockets`
2. Create a savings pocket:
   ```
   Name: Vacation Fund
   Target Amount: $500
   Category: Travel
   ```
3. Fund the pocket:
   ```
   Transfer: $20 from main wallet
   ```
4. **Verify**:
   - ✅ Pocket created successfully
   - ✅ Balance moved from main wallet to pocket
   - ✅ Transaction type = "goal_fund"

### Step 5: Test Save2740 Challenge (Daily Savings)
1. Navigate to `/save2740` or `/save2740/create`
2. Create daily savings challenge:
   ```
   Daily Amount: $27.40
   Frequency: Daily
   Start Date: Today
   ```
3. Make a contribution:
   - Click "Save Today"
   - Confirm auto-debit setup
4. **Verify**:
   - ✅ Challenge created
   - ✅ Daily saving recorded
   - ✅ Streak counter updates
   - ✅ Transaction type = "save_daily"

### ✅ Saver Account Checklist
- [ ] Can deposit money to wallet
- [ ] Can withdraw money from wallet
- [ ] Can create savings pockets (goals)
- [ ] Can fund pockets from wallet
- [ ] Can join Save2740 challenge
- [ ] Can make daily contributions
- [ ] All transactions show in wallet history
- [ ] User type = "savings_only" in admin panel

---

## Part 2: Testing Osusu Groups (Group Contributions)

### Step 1: Create Test Group (User A - Owner)
1. Login as first test account: `groupowner@test.com`
2. Navigate to `/group-contribution` or `/save2740` (check which page has groups)
3. Create a new group:
   ```
   Group Name: Test Osusu Circle
   Purpose: Testing group contributions
   Contribution Amount: $100
   Frequency: Weekly
   Max Members: 3
   Payout Rule: As-joined (FIFO)
   ```
4. **Verify**:
   - ✅ Group created with status "open"
   - ✅ Join code displayed
   - ✅ Creator is member #1
   - ✅ User type = "group_owner" (check admin)

### Step 2: Join Group (User B - Member)
1. **Logout** and create/login as second account: `member1@test.com`
2. Navigate to groups page
3. Click **"Join Group"** or use join code
4. Enter the group code from Step 1
5. **Verify**:
   - ✅ Successfully joined as member #2
   - ✅ Group status still "open" (needs min members)
   - ✅ User type = "contributor" (check admin)

### Step 3: Fill Group (User C - Member)
1. **Logout** and create/login as third account: `member2@test.com`
2. Join the same group using join code
3. **Verify**:
   - ✅ Successfully joined as member #3
   - ✅ Group status changes to "locked"
   - ✅ Group start date set (3 days from now)
   - ✅ Rounds initialized
   - ✅ User type = "contributor"

### Step 4: Make Contributions (All Members)
1. Wait for group to become "active" or **manually update in DB**:
   ```javascript
   // In MongoDB or via API
   db.groups.updateOne(
     { joinCode: "YOUR_CODE" },
     { $set: { status: "active", startDate: new Date() } }
   )
   ```

2. **Member 1 (Owner) Contributes**:
   - Navigate to group detail page
   - Click "Contribute" for current round
   - Amount: $100
   - **Verify**:
     - ✅ Contribution recorded
     - ✅ Round status = "in_progress"
     - ✅ Transaction type = "group_contribution"
     - ✅ Escrow balance increases

3. **Member 2 Contributes**:
   - Login as member1@test.com
   - Navigate to group
   - Contribute $100
   - **Verify**: contribution recorded

4. **Member 3 Contributes**:
   - Login as member2@test.com
   - Contribute $100
   - **Verify**:
     - ✅ Round status = "completed"
     - ✅ Total collected = $300
     - ✅ Payout triggered to recipient (Member 1)

### Step 5: Verify Payout
1. Login as group owner (recipient of first round)
2. Check wallet/transactions
3. **Verify**:
   - ✅ Payout transaction received ($300)
   - ✅ Transaction type = "payout" or "group_payout"
   - ✅ Group advances to Round 2
   - ✅ New recipient = Member 2

### Step 6: Test Missed Contribution (Chain Break)
1. Start Round 2
2. Member 1 and 3 contribute
3. **Member 2 DOES NOT contribute** (let grace period expire)
4. **Verify**:
   - ✅ Member 2 marked as "missed"
   - ✅ Late fee calculated (if within grace period)
   - ✅ Chain break recorded (if past grace period)
   - ✅ Member 2 status = "chain_broken"
   - ✅ Group status may change to "at_risk"

### Step 7: Test Group Completion
1. Complete all remaining rounds with contributions
2. **Verify**:
   - ✅ All members receive payout (except defaulted)
   - ✅ Group status = "completed"
   - ✅ Escrow balance = 0
   - ✅ Final audit logs complete

### ✅ Osusu Group Checklist
- [ ] Can create a group
- [ ] Can join group with code
- [ ] Group locks when full
- [ ] Rounds initialize correctly
- [ ] Can contribute to current round
- [ ] Round completes when all contribute
- [ ] Payout sent to correct recipient
- [ ] Group advances to next round
- [ ] Missed contributions detected
- [ ] Late fees calculated
- [ ] Chain breaks recorded
- [ ] Group completes successfully
- [ ] User types classify correctly (owner vs contributor)

---

## Part 3: Testing Wallet Separation

### Current State (Before Implementation)
⚠️ **WARNING**: Wallet separation is NOT YET fully implemented.
- Savings and contributions currently share ONE wallet
- Need to complete Phase 2-5 of implementation plan

### After Implementation (Testing Objectives)
1. **Verify Separate Wallets**:
   ```javascript
   // API Test
   GET /api/user/wallets
   // Should return:
   {
     savingsWallet: { balance: 100, ... },
     contributionWallet: { balance: 50, escrowBalance: 30, ... }
   }
   ```

2. **Verify Independent Freezing**:
   - Admin freezes contribution wallet
   - **Verify**:
     - ✅ Cannot make group contributions
     - ✅ CAN still deposit/withdraw from savings
     - ✅ User explicitly notified about freeze

3. **Verify Fund Isolation**:
   - Deposit $50 to savings
   - Contribute $30 to group
   - **Verify**:
     - ✅ Savings wallet: +$50
     - ✅ Contribution wallet: -$30
     - ✅ Transactions logged separately
     - ✅ No cross-contamination

---

## Admin Panel Testing

### Step 1: View User Classification
1. Navigate to `http://localhost:3001` (Admin Panel)
2. Login with admin credentials
3. Navigate to **Users** page (`/users`)
4. View user details for test accounts
5. **Verify Classifications**:
   - ✅ saver1@test.com = "savings_only"
   - ✅ groupowner@test.com = "group_owner" or "both"
   - ✅ member1@test.com = "contributor"

### Step 2: Filter Users by Type
1. On Users page, use filters:
   - Filter: "Savings Only"
   - Filter: "Contributors"
   - Filter: "Group Owners"
2. **Verify**:
   - ✅ Correct users appear in each filter
   - ✅ Counts match expected

### Step 3: View Group Activity
1. Navigate to **Groups** page (`/groups`)
2. View group details
3. **Verify**:
   - ✅ All members listed
   - ✅ Round history visible
   - ✅ Contribution status tracked
   - ✅ Missed contributions flagged

### Step 4: Test Contribution Pause (When Implemented)
1. Open user detail page
2. Click **"Pause Contributions"**
3. Enter reason: "Testing pause functionality"
4. **Verify**:
   - ✅ User's contributionsEnabled = false
   - ✅ User cannot contribute to groups
   - ✅ User CAN still use savings features
   - ✅ Audit log created

---

## API Testing (Postman/cURL)

### Test Endpoints

#### 1. Get User Wallets
```bash
GET http://localhost:5000/api/wallet
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 2. Deposit to Savings
```bash
POST http://localhost:5000/api/wallet/deposit
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 5000,
  "paymentMethodId": "pm_test_123"
}
```

#### 3. Create Group
```bash
POST http://localhost:5000/api/groups
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Test Osusu",
  "purpose": "Testing",
  "contributionAmount": 10000,
  "frequency": "weekly",
  "maxMembers": 3
}
```

#### 4. Join Group
```bash
POST http://localhost:5000/api/groups/join
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "joinCode": "ABC123"
}
```

#### 5. Contribute to Group
```bash
POST http://localhost:5000/api/groups/:groupId/contribute
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 10000,
  "roundNumber": 1
}
```

---

## Common Issues & Troubleshooting

### Issue: "Insufficient funds"
**Solution**: Ensure wallet has sufficient balance before contributions
```bash
# Check balance
GET /api/wallet

# Add test funds
POST /api/test/create-test-deposit
{ "amount": 10000, "userId": "YOUR_USER_ID" }
```

### Issue: "Group not accepting contributions"
**Possible Causes**:
- Group status not "active"
- Round already completed
- User already contributed this round
- Contributions paused (per-user, per-group, or global)

**Solution**: Check group status in database or admin panel

### Issue: "Cannot see groups page"
**Solution**: Ensure groups routes are enabled in frontend
```typescript
// Check: frontend/app/group-contribution/page.tsx exists
// Check: backend/src/routes/groups.routes.ts is mounted
```

### Issue: "User type not updating"
**Solution**: User classification logic needs to be implemented
- Currently defaults to "savings_only"
- Will auto-update once Phase 2 services are complete

---

## Success Criteria

### ✅ Saver Account Working If:
- Can deposit and withdraw
- Transactions logged correctly
- Pockets/goals functional
- Save2740 challenge works
- User classified as "savings_only"

### ✅ Osusu Groups Working If:
- Can create and join groups
- Group lifecycles correctly (open → locked → active → completed)
- Contributions recorded and validated
- Payouts distributed to correct recipients
- Round progression works
- Missed contributions/chain breaks detected
- User classified as "contributor" or "group_owner"

### ✅ Separation Working If:
- Two distinct wallets exist per user
- Contributions don't affect savings balance
- Can freeze contribution wallet independently
- Audit logs separate transactions by type
- Admin can view and control each behavior independently

---

## Next Steps After Testing

1. **Document Issues**: Note any failures or unexpected behavior
2. **Test Edge Cases**: 
   - What happens if only 1 person contributes?
   - What if nobody contributes?
   - Can you join multiple groups?
   - What if group owner leaves?
3. **Performance Test**: Create groups with max members (10-20)
4. **Security Test**: Try unauthorized access to other groups
5. **Migration Test**: Test existing users after wallet separation

---

**Last Updated**: 2026-02-10
**Test Environment**: Development (localhost)
**Status**: Saver ✅ | Groups ✅ | Separation ⏳ (Partially implemented)
