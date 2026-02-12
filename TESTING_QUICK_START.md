# Quick Start: Testing Osusu Groups & Savings

## 🚀 Fastest Way to Test

### Option 1: Automated Setup (Recommended)
```bash
# Run this to create test accounts automatically
cd backend
npx ts-node scripts/quick-test-setup.ts
```

This creates:
- ✅ 4 test users with wallets
- ✅ 1 test Osusu group (ready to join)
- ✅ Sample transactions
- ✅ Proper user classifications

### Option 2: Manual Testing
Follow the detailed guide: `TESTING_GUIDE_OSUSU_AND_SAVINGS.md`

---

## 📋 What to Test

### Test Savings (Individual)
1. Login as `saver@test.com`
2. Go to "My Wallet"
3. Add money → Withdraw money
4. Create savings pocket/goal
5. Join Save2740 daily challenge

**Expected**: User type = "savings_only" ✅

### Test Groups (Osusu)
1. Login as `owner@test.com`
2. Create or view test group
3. Note the join code
4. Login as `member1@test.com`
5. Join using code
6. Repeat with `member2@test.com`
7. Make contributions (all members)
8. Verify payout to first recipient

**Expected**: 
- Owner type = "group_owner" ✅
- Members type = "contributor" ✅

---

## 🔍 What to Verify

### Savings Working ✅
- [ ] Can deposit
- [ ] Can withdraw
- [ ] Balance updates correctly
- [ ] Transactions logged

### Groups Working ✅
- [ ] Can create group
- [ ] Can join with code
- [ ] Group locks when full
- [ ] Contributions recorded
- [ ] Payouts distributed
- [ ] Rounds progress

### Separation Working ⏳
- [ ] Two wallets per user (after Phase 2)
- [ ] Independent freezing (after Phase 2)
- [ ] No fund mixing (after Phase 2)

---

## 🐛 Common Issues

**"Insufficient funds"**
→ Add test deposit via `/api/test/create-test-deposit`

**"Group not found"**
→ Check join code is correct

**"Cannot contribute"**
→ Ensure group status is "active"

**"User type not updating"**
→ Services not yet implemented (Phase 2)

---

## 📁 Important Files
- Full guide: `TESTING_GUIDE_OSUSU_AND_SAVINGS.md`
- Implementation plan: `FINANCIAL_BEHAVIOR_SEPARATION_PLAN.md`
- Status tracker: `FINANCIAL_BEHAVIOR_SEPARATION_STATUS.md`

---

## 🎯 Current Status
- ✅ **Models**: Complete (Phase 1)
- ⏳ **Services**: Not started (Phase 2)
- ⏳ **APIs**: Not started (Phase 3)
- ⏳ **UI**: Not started (Phase 4)

**Next**: Implement user classification & wallet segregation services
