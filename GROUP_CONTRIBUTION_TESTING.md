# Group Contribution - Testing Guide

**Date**: 2026-02-04  
**Status**: Backend ✅ | Frontend UI ✅ | Integration ✅

---

## 🧪 Complete Testing Flow

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- At least 2 user accounts created
- Each user has sufficient wallet balance (≥ $100)

### Test Scenario: 5-Member Monthly Group

#### **Step 1: Create a Group (User A)**

1. Login as User A
2. Navigate to `/group-contribution`
3. Click **"Join Teamwork Mode"**
4. Fill in the form:
   - **Group Name**: "Family Savings Circle"
   - **Purpose**: "Vacation fund for 2026"
   - **Contribution Amount**: $100
   - **Frequency**: Monthly
   - **Max Members**: 5
   - **Closing Date**: (30 days from now)
   - **Payout Order**: Random

5. Click **"Create Group"**
6. **Expected**: Group created, join code displayed

#### **Step 2: Copy Join Code**

1. On the group detail page, copy the **Join Code** (e.g., `ABC123`)
2. Share this code with other test users

#### **Step 3: Join Group (Users B, C, D, E)**

1. Login as User B
2. Navigate to `/group-contribution`
3. Click **"+ Add Member"** or **"Join Group"**
4. Enter the join code: `ABC123`
5. Click **"Join"**
6. **Expected**: User added to group

**Repeat for Users C, D, and E**

#### **Step 4: Verify Auto-Lock**

1. After User E joins (5th member):
   - ✅ Group status should change to **"locked"**
   - ✅ `autoStartDate` set to 3 days from now
   - ✅ `autoEndDate` set to 5 months from start
   - ✅ Invite link disabled
   - ✅ Email sent to all members

2. Check backend terminal for:
   ```
   ✅ Group Family Savings Circle (GROUP_ID) locked. Start: 2026-02-07
   ```

#### **Step 5: Manual Round Initialization (Test)**

Instead of waiting 3 days, manually trigger:

```powershell
curl -X POST http://localhost:5000/api/cron-test/group-round-init
```

**Expected**:
- Group status → `active`
- 5 rounds created
- Round 1 due date set
- Email sent to all members

Verify in MongoDB:
```javascript
db.groups.find({ name: "Family Savings Circle" })
```

Check `rounds` array has 5 items.

#### **Step 6: Make Contributions (Round 1)**

**All 5 members must contribute:**

1. Login as each member
2. Go to group detail page
3. Click **"Contribute"**
4. Enter amount: `$100`
5. Click **"Submit"**

**Expected**:
- Funds deducted from wallet
- Added to escrow
- Contribution recorded in `rounds[0].contributions`
- Toast notification: "Contribution Successful!"

#### **Step 7: Verify Round Completion**

After all 5 members contribute:
- ✅ Round 1 status → `completed`
- ✅ Recipient receives `$500` payout
- ✅ Payout transaction created
- ✅ Email sent to recipient
- ✅ **Round 2 automatically begins**

Check backend logs:
```
✅ Payout processed: $500 → Member Name (Round 1)
```

#### **Step 8: Continue Rounds**

Repeat Step 6 for Rounds 2, 3, 4, 5 until all members have received their payout.

---

## ⚠️ Test Chain Break Scenario

### Setup: Member Misses Contribution

1. Start Round 3
2. Have only 4 members contribute (1 member skips)
3. Wait 24 hours (or manually adjust `dueDate` in DB)
4. Run chain-break detection:

```powershell
curl -X POST http://localhost:5000/api/cron-test/group-chain-breaks
```

**Expected**:
- ✅ Missing member status → `chain_broken`
- ✅ Member removed from group
- ✅ Forfeited funds ($200) distributed to remaining 4 members ($50 each)
- ✅ Email sent to all members
- ✅ Group status → `at_risk` or `failed` (if < 2 members remain)

Check backend logs:
```
❌ Chain break detected in group Family Savings Circle. Missing: 1 members
❌ Chain break handled: Member Name removed from Family Savings Circle
```

---

## 📋 API Endpoints to Test

### Group Management
```powershell
# List user's groups
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/groups

# Get group details
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/groups/GROUP_ID

# Create group
curl -X POST http://localhost:5000/api/groups \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","contributionAmount":100,"frequency":"monthly","maxMembers":5}'

# Join group
curl -X POST http://localhost:5000/api/groups/join \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"joinCode":"ABC123"}'
```

### Contributions
```powershell
# Make contribution
curl -X POST http://localhost:5000/api/groups/GROUP_ID/contribute \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'

# Get rounds
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/groups/GROUP_ID/rounds

# Get ledger
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/groups/GROUP_ID/ledger
```

### Admin/Testing
```powershell
# Manually lock group
curl -X POST http://localhost:5000/api/groups/GROUP_ID/lock \
  -H "Authorization: Bearer TOKEN"

# Manually start group
curl -X POST http://localhost:5000/api/groups/GROUP_ID/start \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Verification Checklist

### Database Checks (MongoDB)

```javascript
// Check group structure
db.groups.find({ status: "active" }).pretty()

// Check rounds for a group
db.groups.findOne({ _id: ObjectId("GROUP_ID") }).rounds

// Check contributions
db.groups.aggregate([
  { $match: { _id: ObjectId("GROUP_ID") } },
  { $unwind: "$rounds" },
  { $project: { "rounds.contributions": 1 } }
])

// Check chain breaks
db.groups.findOne({ _id: ObjectId("GROUP_ID") }).chainBreaks

// Verify wallet changes
db.wallets.find({ userId: ObjectId("USER_ID") })

// Check transactions
db.transactions.find({ "metadata.groupId": ObjectId("GROUP_ID") })
```

### Email Checks

You should receive emails for:
1. ✉️ Group locked
2. ✉️ Group started
3. ✉️ Contribution deadline approaching
4. ✉️ Payout received
5. ✉️ Next round started
6. ✉️ Chain break notification

Check SMTP logs or inbox (if using real SMTP).

---

## 🐛 Common Issues & Solutions

### Issue 1: Group Not Locking
**Problem**: Group doesn't lock when reaching max members  
**Solution**: Check `groups.routes.ts` line 201-217. Ensure `lockGroupIfFull` is called.

### Issue 2: Rounds Not Initializing
**Problem**: Cron job doesn't start group  
**Solution**: 
- Check `autoStartDate` is in the past
- Manually trigger: `curl -X POST /api/cron-test/group-round-init`

### Issue 3: Contribution Fails
**Problem**: API returns 400/500  
**Check**:
- User has sufficient balance
- Group status is `active`
- User is active member
- Round is not already complete

### Issue 4: Chain Break Not Detected
**Problem**: Member doesn't get penalized  
**Solution**:
- Check `dueDate` and `gracePeriodHours`
- Manually trigger: `curl -X POST /api/cron-test/group-chain-breaks`

### Issue 5: Payout Not Sent
**Problem**: Member doesn't receive payout  
**Check**:
- All members contributed for the round
- Round status is `completed`
- Escrow balance is sufficient
- Wallet exists for recipient

---

## 📊 Expected Data Flow

```
1. Group Created
   ↓
2. Members Join (auto-locks at max)
   ↓
3. Round Initialization (after auto-start date)
   ↓
4. Round 1: All contribute → Payout to Member A
   ↓
5. Round 2: All contribute → Payout to Member B
   ↓
6. Round 3: All contribute → Payout to Member C
   ↓
7. Round 4: All contribute → Payout to Member D
   ↓
8. Round 5: All contribute → Payout to Member E
   ↓
9. Group Status → "completed"
```

**Total Time**: 5 months (for monthly frequency)  
**Each Member**: Contributes $500 total, receives $500 once

---

## 🎯 Success Criteria

- ✅ Group creation works
- ✅ Members can join via code
- ✅ Group auto-locks at max capacity
- ✅ Rounds initialize correctly
- ✅ Contributions deduct from wallet
- ✅ Payouts credit recipient wallet
- ✅ Chain breaks penalize correctly
- ✅ Emails sent at all stages
- ✅ Ledger shows accurate history
- ✅ Escrow balance reconciles

---

## 📝 Notes

- **Grace Period**: 24 hours default (configurable)
- **Late Fee**: 5% of contribution (configurable)
- **Chain Break Penalty**: 90 days ban (configurable)
- **Max Members**: 10 (enforced)
- **Contribution Range**: $100-$5,000 (enforced)

---

**Happy Testing!** 🚀
