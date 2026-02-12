# Financial Behavior Separation - Implementation Plan

## Overview
The Save2740 platform must clearly separate and control two distinct financial behaviors:
1. **Personal Savings** - Individual deposits & withdrawals
2. **Group Contributions (Osusu)** - Rotating group savings

## Current State Analysis

### ✅ What Exists:
- Basic wallet model with balance tracking
- Group/contribution models
- Transaction tracking with types
- Wallet freeze functionality

### ❌ Critical Gaps:
1. **No User Classification System**
   - Missing `userType` field
   - No dynamic classification logic
   - Can't identify savings-only vs contributors

2. **No Wallet Separation**
   - Only ONE wallet per user
   - Savings and contributions share same balance
   - Risk of fund mixing

3. **Insufficient Admin Controls**
   - Can't pause contributions per user
   - Can't pause contributions per group  
   - No global contribution pause
   - Can't freeze contribution wallet separately

## Implementation Tasks

### Phase 1: Data Model Updates

#### Task 1.1: Extend User Model
**File**: `backend/src/models/auth.model.ts`

Add fields:
```typescript
interface IUser {
  // ... existing fields ...
  
  // Financial Behavior Classification
  userType: 'savings_only' | 'contributor' | 'group_owner' | 'both';
  
  // Stats for classification
  totalSavingsDeposits: number;
  totalSavingsWithdrawals: number;
  totalGroupContributions: number;
  groupsOwned: number;
  groupsJoined: number;
  
  // Last activity dates
  lastSavingsActivity?: Date;
  lastContributionActivity?: Date;
  
  // Contribution controls
  contributionsEnabled: boolean;
  contributionsPausedReason?: string;
  contributionsPausedBy?: string; // Admin ID
  contributionsPausedAt?: Date;
}
```

#### Task 1.2: Create Separate Contribution Wallet Model
**File**: `backend/src/models/contribution-wallet.model.ts` (NEW)

```typescript
interface IContributionWallet {
  userId: string;
  
  // Balances
  balance: number; // Total contributions balance
  escrowBalance: number; // Locked in active groups
  availableBalance: number; // Can withdraw
  
  // Limits
  monthlyContributionLimit: number;
  dailyContributionLimit: number;
  
  // Status
  status: 'active' | 'frozen' | 'suspended';
  freezeReason?: string;
  frozenBy?: string;
  frozenAt?: Date;
  
  // Stats
  totalContributed: number;
  totalReceived: number;
  activeGroupsCount: number;
  
  // Ledger reference
  ledgerBalance: number;
}
```

#### Task 1.3: Extend Group Model  
**File**: `backend/src/models/group.model.ts`

Add fields:
```typescript
interface IGroup {
  // ... existing fields ...
  
  // Admin controls
  contributionsPaused: boolean;
  pausedReason?: string;
  pausedBy?: string; // Admin ID
  pausedAt?: Date;
  
  // Status tracking
  atRiskMembers: mongoose.Types.ObjectId[];
  defaultedMembers: mongoose.Types.ObjectId[];
}
```

#### Task 1.4: Create Contribution Ledger Model
**File**: `backend/src/models/contribution-ledger.model.ts` (NEW)

```typescript
interface IContributionLedgerEntry {
  userId: string;
  contributionWalletId: string;
  
  type: 'contribution' | 'payout' | 'refund' | 'penalty' | 'late_fee';
  amount: number;
  groupId?: mongoose.Types.ObjectId;
  roundNumber?: number;
  
  balanceBefore: number;
  balanceAfter: number;
  
  description: string;
  transactionId?: mongoose.Types.ObjectId;
  
  createdAt: Date;
}
```

### Phase 2: Business Logic

#### Task 2.1: User Classification Service
**File**: `backend/src/services/user-classification.service.ts` (NEW)

Functions:
- `classifyUser(userId)` - Determine user type based on activity
- `updateUserClassification(userId)` - Update after each transaction
- `getUserFinancialProfile(userId)` - Get full breakdown

#### Task 2.2: Wallet Separation Logic
**File**: `backend/src/services/wallet-segregation.service.ts` (NEW)

Functions:
- `createContributionWallet(userId)`
- `getSavingsWallet(userId)` 
- `getContributionWallet(userId)`
- `transferBetweenWallets()`  // Admin only, with audit log
- `validateWalletSegregation(userId)` // Integrity check

#### Task 2.3: Contribution Control Service
**File**: `backend/src/services/contribution-control.service.ts` (NEW)

Functions:
- `pauseUserContributions(userId, reason, adminId)`
- `resumeUserContributions(userId, adminId)`
- `pauseGroupContributions(groupId, reason, adminId)`
- `resumeGroupContributions(groupId, adminId)`
- `setGlobalContributionPause(paused, reason, adminId)`
- `freezeContributionWallet(userId, reason, adminId)`

### Phase 3: API Endpoints

#### Task 3.1: Admin User Classification Endpoints
**File**: `backend/src/routes/admin/user-classification.routes.ts` (NEW)

- `GET /api/admin/users/:userId/classification` - Get user type & stats
- `GET /api/admin/users/savings-only` - Filter savings-only users
- `GET /api/admin/users/contributors` - Filter contributors
- `GET /api/admin/users/group-owners` - Filter group owners

#### Task 3.2: Admin Contribution Control Endpoints  
**File**: `backend/src/routes/admin/contribution-control.routes.ts` (NEW)

- `POST /api/admin/users/:userId/pause-contributions`
- `POST /api/admin/users/:userId/resume-contributions`
- `POST /api/admin/groups/:groupId/pause-contributions`
- `POST /api/admin/groups/:groupId/resume-contributions`
- `POST /api/admin/contribution-wallets/:userId/freeze`
- `POST /api/admin/contribution-wallets/:userId/unfreeze`
- `POST /api/admin/system/pause-all-contributions`
- `POST /api/admin/system/resume-all-contributions`

#### Task 3.3: Admin Reporting Endpoints
**File**: `backend/src/routes/admin/contribution-reports.routes.ts` (NEW)

- `GET /api/admin/reports/contribution-activity`
- `GET /api/admin/reports/missed-contributions`
- `GET /api/admin/reports/defaults-and-penalties`
- `GET /api/admin/reports/savings-vs-contributions`

### Phase 4: Admin UI

#### Task 4.1: User Details Page Enhancement
**File**: `admin-panel/app/users/[id]/page.tsx`

Add sections:
- Financial Behavior Classification badge
- Savings Wallet (readonly)
- Contribution Wallet (with freeze button)
- Activity breakdown (savings vs contributions)
- Contribution control buttons

#### Task 4.2: Users List Page Filter
**File**: `admin-panel/app/users/page.tsx`

Add filters:
- User Type (Savings Only / Contributor / Group Owner)
- Contribution Status (Active / Paused / Frozen)

#### Task 4.3: Contribution Control Dashboard
**File**: `admin-panel/app/contributions/page.tsx` (NEW)

Features:
- Global pause toggle
- List of paused users/groups
- Missed contributions tracker
- Default tracker
- Penalty tracker

#### Task 4.4: Reports Page
**File**: `admin-panel/app/reports/contributions/page.tsx` (NEW)

Charts:
- Savings activity vs Contribution activity
- User type distribution
- Contribution health metrics
- Default rate trends

### Phase 5: Database Migration

#### Task 5.1: Migration Script
**File**: `backend/scripts/migrate-wallet-separation.ts` (NEW)

Steps:
1. Create contribution wallet for each user with group activity
2. Split current wallet balance (savings vs contributions)
3. Update user classification based on transaction history
4. Create contribution ledger entries from transaction history
5. Validate data integrity

## Acceptance Criteria Checklist

- [ ] User model has financial behavior classification
- [ ] Separate savings and contribution wallets exist
- [ ] Classification updates automatically based on actions
- [ ] SuperAdmin can view user classification
- [ ] SuperAdmin can filter by user type
- [ ] SuperAdmin can pause contributions per user
- [ ] SuperAdmin can pause contributions per group
- [ ] SuperAdmin can pause contributions globally
- [ ] SuperAdmin can freeze contribution wallet independently
- [ ] Contribution wallet freeze doesn't affect savings
- [ ] Audit logs track all contribution actions
- [ ] Reports separate savings from contributions
- [ ] Missed contributions tracked
- [ ] Penalties tracked
- [ ] Defaults tracked

## Launch-Blocking Priority
🔴 **CRITICAL** - Must be completed before launch

## Estimated Timeline
- Phase 1: 4 hours
- Phase 2: 6 hours  
- Phase 3: 5 hours
- Phase 4: 6 hours
- Phase 5: 3 hours
**Total: ~24 hours** (3 focused work days)

## Next Steps
1. Review and approve this plan
2. Create separate contribution wallet model
3. Extend user model with classification
4. Implement classification logic
5. Build admin controls
6. Test thoroughly
7. Run migration script on staging
8. Deploy to production

---
**Status**: 📋 Awaiting Approval
**Priority**: 🔴 Launch Blocking
**Owner**: Development Team
