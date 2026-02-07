# Group Contribution (Rotational Savings) Feature Specification

**Version**: 1.0  
**Last Updated**: 2026-02-04  
**Status**: Draft for Implementation

---

## 1. Overview

The Group Contribution feature enables users to participate in **Rotating Savings and Credit Associations (ROSCAs)**, commonly known as "Susu", "Ajo", or "Esusu". Members contribute fixed amounts regularly, and each member receives the full pot once during the cycle in a rotating order.

### 1.1 Core Principles
- **Transparency**: All contributions and payouts visible to group members
- **Fairness**: Equal contribution amounts, rotating payout order
- **Accountability**: Penalties for missed contributions
- **Trust**: Chain-breaking consequences to ensure commitment

---

## 2. Membership & Access Control

### 2.1 Eligibility Requirements

**To CREATE a group, users must:**
- ✅ Have an active subscription
- ✅ Have sufficient wallet balance (≥ first contribution amount)
- ✅ Not be restricted by admin
- ✅ Not have reached personal group limits

**To JOIN a group, users must:**
- ✅ Have a valid invite link from an existing member
- ✅ Have sufficient wallet balance (≥ first contribution amount)
- ✅ Have an active subscription
- ✅ Not be in too many active groups (max 5 simultaneous)

### 2.2 Access Restrictions

**Admin can restrict users who:**
- Have broken chains in previous groups
- Have outstanding penalties
- Are flagged for suspicious activity
- Are deactivated accounts

**System automatically blocks:**
- Users with insufficient funds
- Unverified accounts
- Suspended accounts

---

## 3. Group Configuration

### 3.1 Required Settings

Every group must define:

| **Parameter** | **Description** | **Constraints** |
|--------------|-----------------|-----------------|
| **Group Name** | Unique identifier | 3-50 characters |
| **Contribution Amount** | Fixed amount per member per cycle | $100 - $5,000 |
| **Frequency** | Contribution cycle | Daily, Weekly, Monthly |
| **Max Members** | Group capacity | 2-10 members |
| **Start Date** | First contribution deadline | Auto-set when group locks |
| **Payout Order** | Rotation sequence | Random, Manual, As-Joined |

### 3.2 Group Limits

**Per Group:**
- **Minimum Members**: 2
- **Maximum Members**: 10 (to ensure completion within 1 year)
- **Minimum Contribution**: $100
- **Maximum Contribution**: $5,000

**Per User:**
- **Active Groups (as member)**: 5
- **Active Groups (as creator)**: 3

**Platform-Wide:**
- **Active Groups (Total)**: 20-30 concurrent groups
- **Pending Groups**: 10 (unfilled groups)

---

## 4. Group Lifecycle

### 4.1 States

```
OPEN → LOCKED → ACTIVE → COMPLETED / FAILED
```

| **State** | **Description** | **Actions Allowed** |
|-----------|-----------------|---------------------|
| **OPEN** | Accepting new members | Join, Invite, Cancel |
| **LOCKED** | Full capacity, waiting for start | View, Leave (with penalty) |
| **ACTIVE** | Contributions in progress | Contribute, View Ledger |
| **COMPLETED** | All payouts distributed | View History, Archive |
| **FAILED** | Chain broken or expired | View, Refund (if applicable) |

### 4.2 Automatic Locking

A group **automatically locks** when:
1. **Maximum members** is reached, OR
2. **Manual lock** by creator (if at least 2 members)

**When locked, the system sets:**
- ✅ `status = "locked"`
- ✅ `lockedDate = current_date`
- ✅ `autoStartDate = lockedDate + 3 days` (grace period)
- ✅ `autoEndDate = autoStartDate + (totalMembers × cycleFrequency)`

**Example:**
```
5 members, monthly contributions
Start: Feb 10, 2026
End: Jul 10, 2026 (5 months)
```

### 4.3 Group Expiration

**Groups expire if:**
- Open for 30 days without filling
- Inactive for 60 days after lock
- Creator cancels before start

**On expiration:**
- Status → `failed`
- All locked funds returned to members
- Group archived

---

## 5. Contribution Rules

### 5.1 Contribution Mechanics

**All members MUST contribute:**
- ✅ The same fixed amount
- ✅ For every cycle until completion
- ✅ Before the deadline each cycle

**Example (5 members, $100/month):**

| **Round** | **Date** | **Contributors** | **Recipient** | **Pot** |
|-----------|----------|------------------|---------------|---------|
| 1 | Feb 2026 | All 5 members | Member A | $500 |
| 2 | Mar 2026 | All 5 members | Member B | $500 |
| 3 | Apr 2026 | All 5 members | Member C | $500 |
| 4 | May 2026 | All 5 members | Member D | $500 |
| 5 | Jun 2026 | All 5 members | Member E | $500 |

**Total cycle**: 5 months  
**Each member**: Contributes $500 total, receives $500 once

### 5.2 Contribution Deadline

**Deadlines are:**
- Set based on group frequency (daily 11:59 PM, weekly Sunday 11:59 PM, monthly last day)
- Non-negotiable
- Visible in group dashboard

**Late contributions:**
- ⚠️ Grace period: 24 hours
- ⚠️ Late fee: 5% of contribution amount
- ❌ Beyond grace: Chain broken

### 5.3 Payment Processing

**When a member contributes:**
1. Funds deducted from wallet
2. Funds held in group escrow account
3. Transaction recorded in ledger
4. Member marked as "paid" for current round

**When payout occurs:**
1. All contributions collected
2. Escrow released to recipient
3. Transaction recorded
4. Next round begins

---

## 6. Payout Order & Rotation

### 6.1 Payout Order Rules

**Options:**

| **Rule** | **Description** | **When to Use** |
|----------|-----------------|-----------------|
| **As-Joined** | First to join = first to receive | Default, simple |
| **Random** | Shuffled order at lock | Fair, prevents gaming |
| **Manual** | Creator assigns order | High-trust groups |
| **Auction** | Bid for early position | Advanced feature |

### 6.2 Rotation Logic

**Each member receives payout exactly once.**

```
Round 1: Member at position 1 receives
Round 2: Member at position 2 receives
...
Round N: Member at position N receives
```

**After all members receive:**
- Group status → `completed`
- Final ledger generated
- Group archived

---

## 7. Penalty & Chain Rules

### 7.1 Chain Breaking

**A member BREAKS THE CHAIN if they:**
- ❌ Miss a contribution deadline (beyond grace period)
- ❌ Leave the group mid-cycle
- ❌ Have insufficient funds when auto-debit runs

### 7.2 Consequences

**When a chain is broken:**

1. **The offending member:**
   - ❌ **Loses all prior contributions** (non-refundable)
   - ❌ Removed from group
   - ❌ Flagged in their profile
   - ❌ Restricted from joining new groups for 90 days

2. **The group:**
   - ⚠️ Status → `at_risk`
   - Admin notified
   - Remaining members vote: Continue or Dissolve

3. **Remaining members (if continuing):**
   - Adjust payout amounts proportionally
   - OR recruit replacement (if early in cycle)

**Example:**
```
5 members, $100/month, Member C breaks chain in Round 3

Option 1: Dissolve
- All members refunded remaining contributions
- Group ends

Option 2: Continue
- Remaining 4 members continue
- Member C's forfeited funds distributed proportionally
```

### 7.3 Dispute Resolution

**If a member claims unfair penalty:**
- Admin reviews ledger
- Evidence required (bank statements, proof of payment)
- Decision final within 7 days

---

## 8. Admin Controls

### 8.1 Group Management

**Admin can:**
- ✅ View all groups (open, active, completed)
- ✅ Disable/close groups
- ✅ Override contribution limits
- ✅ Manually adjust payout order
- ✅ Resolve disputes
- ✅ Freeze contributions
- ✅ Export ledgers for audit

### 8.2 User Management

**Admin can:**
- ✅ Restrict users from creating/joining groups
- ✅ Review chain-breaking history
- ✅ Issue warnings or bans
- ✅ Refund contributions (with justification)
- ✅ Manually mark contributions as paid

### 8.3 Platform Limits

**Admin configures:**
- Maximum active groups (20-30)
- Contribution ranges ($100-$5,000)
- Grace period duration (default 24h)
- Late fee percentage (default 5%)
- Chain-break penalty duration (default 90 days)

---

## 9. System Behavior

### 9.1 Auto-Close Inactive Groups

**Groups are auto-closed if:**
- Open for 30+ days without filling
- No contributions in 60 days (active groups)
- Creator account deactivated

**On auto-close:**
- All members notified
- Funds refunded
- Group archived

### 9.2 Preventing Excessive Groups

**System limits:**
- Max 10 open (unfilled) groups at once
- If limit reached, oldest open group auto-expires
- Users can't create new groups if they have 3+ open

### 9.3 Notifications

**Members receive notifications for:**
- 📧 Group invitation
- 📧 Group locked (start date set)
- 📧 Contribution deadline approaching (3 days, 1 day, 1 hour)
- 📧 Contribution received
- 📧 Payout received
- 📧 Chain broken (by another member)
- 📧 Group completed

---

## 10. Ledger & Transparency

### 10.1 Group Ledger

**Every group maintains a public ledger showing:**

| **Round** | **Due Date** | **Recipient** | **Expected** | **Collected** | **Status** |
|-----------|--------------|---------------|--------------|---------------|------------|
| 1 | Feb 28 | Alice | $500 | $500 | Completed ✅ |
| 2 | Mar 31 | Bob | $500 | $500 | Completed ✅ |
| 3 | Apr 30 | Carol | $500 | $400 | Chain Broken ❌ |

### 10.2 Member Ledger

**Each member sees:**
- Their total contributions
- Their payout date
- Their payment status each round
- Other members' statuses (anonymous or named)

### 10.3 Audit Trail

**Immutable log of:**
- All contributions
- All payouts
- Payout order changes
- Member joins/leaves
- Admin actions

---

## 11. Technical Requirements

### 11.1 Database Schema

**Groups Collection:**
```typescript
{
  _id: ObjectId,
  name: string,
  contributionAmount: number,
  frequency: 'daily' | 'weekly' | 'monthly',
  maxMembers: number,
  currentMembers: number,
  status: 'open' | 'locked' | 'active' | 'completed' | 'failed',
  payoutOrderRule: 'as-joined' | 'random' | 'manual',
  startDate: Date,
  endDate: Date,
  lockedDate: Date,
  creatorId: ObjectId,
  joinCode: string,
  members: [{
    userId: ObjectId,
    name: string,
    joinedAt: Date,
    payoutPosition: number,
    totalContributed: number,
    status: 'active' | 'inactive' | 'removed'
  }],
  rounds: [{
    roundNumber: number,
    dueDate: Date,
    recipientId: ObjectId,
    expectedAmount: number,
    collectedAmount: number,
    status: 'pending' | 'completed' | 'failed',
    contributions: [{
      userId: ObjectId,
      amount: number,
      paidAt: Date,
      status: 'paid' | 'pending' | 'late' | 'missed'
    }],
    payoutTransactionId: ObjectId
  }],
  escrowBalance: number,
  totalBalance: number,
  createdAt: Date,
  updatedAt: Date
}
```

### 11.2 API Endpoints

**Group Management:**
```
POST   /api/groups                    - Create group
GET    /api/groups                    - List user's groups
GET    /api/groups/:id                - Get group details
POST   /api/groups/join               - Join via code
POST   /api/groups/:id/leave          - Leave group
DELETE /api/groups/:id                - Delete group (creator only)
```

**Contributions:**
```
POST   /api/groups/:id/contribute     - Make contribution
GET    /api/groups/:id/contributions  - Get all contributions
POST   /api/groups/:id/payout         - Process payout (system)
```

**Ledger:**
```
GET    /api/groups/:id/ledger         - Get group ledger
GET    /api/groups/:id/rounds         - Get all rounds
GET    /api/groups/:id/round/:number  - Get specific round
```

**Admin:**
```
GET    /api/admin/groups              - List all groups
POST   /api/admin/groups/:id/close    - Close group
POST   /api/admin/groups/:id/resolve  - Resolve dispute
```

### 11.3 Cron Jobs

**Daily Jobs:**
- Check for due contributions
- Send reminders (3 days, 1 day, 1 hour before)
- Process automatic contributions (if enabled)
- Detect chain breaks
- Process payouts

**Weekly Jobs:**
- Clean up expired groups
- Generate reports
- Check escrow balances

---

## 12. UI/UX Requirements

### 12.1 Group Dashboard

**Show:**
- My active groups
- Next contribution due
- My next payout date
- Create group button
- Join group button

### 12.2 Group Detail Page

**Display:**
- Group name & stats
- Current round
- Payout order (visual timeline)
- Contribution status grid
- Ledger table
- Member list
- Invite link/code

### 12.3 Contribution Flow

1. Click "Contribute" button
2. Confirm amount
3. Confirm wallet deduction
4. Success message
5. Update ledger in real-time

---

## 13. Security Considerations

### 13.1 Fraud Prevention

**Measures:**
- Email/phone verification required
- Contribution cooldown (prevent spam)
- Rate limiting on group creation
- Anti-bot protection
- Identity verification for high amounts

### 13.2 Fund Safety

**Escrow handling:**
- Funds held in secure escrow account
- Multi-signature approval for large payouts
- Daily reconciliation
- Insurance/reserve fund for system failures

### 13.3 Privacy

**Data protection:**
- Member names visible only within group
- External ledger shows positions, not names
- Payment details encrypted
- GDPR/CCPA compliance

---

## 14. Success Metrics

Track:
- **Group completion rate**: % of groups that complete full cycle
- **Chain break rate**: % of members who break chains
- **Average group size**: Typical number of members
- **Popular frequency**: Daily/Weekly/Monthly preference
- **User retention**: % of users who join 2+ groups
- **Escrow accuracy**: 100% fund reconciliation

---

## 15. Future Enhancements

**Phase 2 features:**
- ✨ Auction-based payout order (bid for early position)
- ✨ Partial payouts (receive in installments)
- ✨ Group insurance (protect against chain breaks)
- ✨ Credit scoring (based on contribution history)
- ✨ Dynamic contribution amounts (adjust mid-cycle)
- ✨ Multi-currency support
- ✨ Social features (group chat, reviews)

---

## 16. Implementation Checklist

- [ ] Update Group model with new fields
- [ ] Implement group locking logic
- [ ] Create round management system
- [ ] Build contribution processing
- [ ] Implement payout rotation
- [ ] Add penalty/chain-break logic
- [ ] Create admin controls
- [ ] Build group dashboard UI
- [ ] Implement invite system
- [ ] Add notification triggers
- [ ] Create ledger views
- [ ] Write comprehensive tests
- [ ] Conduct security audit
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Production deployment

---

## Appendix A: Example Scenarios

### Scenario 1: Successful Monthly Group

**Setup:**
- 5 members
- $100/month
- Start: Feb 1, 2026

**Timeline:**
- Feb: All contribute $100 → Alice receives $500
- Mar: All contribute $100 → Bob receives $500
- Apr: All contribute $100 → Carol receives $500
- May: All contribute $100 → Dave receives $500
- Jun: All contribute $100 → Eve receives $500

**Outcome:** ✅ Completed successfully

### Scenario 2: Chain Break in Round 3

**Setup:**
- Same as Scenario 1

**Timeline:**
- Feb: All contribute → Alice receives $500
- Mar: All contribute → Bob receives $500
- Apr: Carol fails to contribute → CHAIN BROKEN

**Outcome:** 
- Carol loses $200 (her Feb + Mar contributions)
- Remaining 4 members vote to continue
- Carol's $200 split among group ($50 each)
- Group continues with 4 members

---

**End of Specification**
