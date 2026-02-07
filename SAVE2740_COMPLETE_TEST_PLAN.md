# Save2740 Complete Test Plan

**Version**: 1.0  
**Date**: February 2, 2026  
**Test Environment**: Development (localhost)

---

## 🎯 Test Scope

This document covers comprehensive testing of the Save2740 application including:
- Core Product Flows (Savings Plans)
- Authentication & Access
- Wallet & Transactions
- Payment Methods
- User Profile & KYC
- Admin Panel
- Edge Cases & Error Handling

---

## 📋 Pre-Test Setup

### Required Test Accounts

1. **Regular User Account**
   - Email: `testuser@example.com`
   - Password: `Test123!@#`
   - Status: Verified

2. **Admin Account**
   - Email: `admin@save2740.com`
   - Password: `Admin123!@#`
   - Role: System Admin

3. **Unverified User Account**
   - Email: `unverified@example.com`
   - Password: `Test123!@#`
   - Status: Unverified

### Test Data Requirements
- Valid bank account details (for testing, use sandbox)
- Valid card details (for testing, use Stripe test cards)
- Test phone number for OTP

### Environment Checklist
- [ ] Frontend running on `localhost:3000`
- [ ] Backend running on configured port
- [ ] Admin Panel running on `localhost:3001`
- [ ] Database seeded with test data
- [ ] Stripe test mode enabled
- [ ] All dev tools accessible (browser console, network tab)

---

## 🔐 Part 1: Authentication & Access Flow

### Test Case 1.1: User Registration
**Priority**: Critical  
**User Story**: As a new user, I want to create an account

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to `/auth/signup` | Sign up page loads | ☐ |
| 2 | Leave all fields empty, click Sign Up | Validation errors shown for all required fields | ☐ |
| 3 | Enter invalid email format | "Invalid email format" error | ☐ |
| 4 | Enter weak password (e.g., "123") | "Password too weak" error | ☐ |
| 5 | Enter mismatched passwords | "Passwords do not match" error | ☐ |
| 6 | Enter valid data and submit | Account created successfully | ☐ |
| 7 | Check email verification prompt | Email verification message displayed | ☐ |
| 8 | Try to access protected routes | Redirected to email verification page | ☐ |

**Validation**:
- ✓ Email sent to provided address
- ✓ User record created in database
- ✓ Password is hashed (not stored in plain text)

---

### Test Case 1.2: Email Verification
**Priority**: Critical

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Check email inbox | Verification email received | ☐ |
| 2 | Click verification link | Redirected to verification success page | ☐ |
| 3 | Try to verify again with same link | "Already verified" or "Invalid link" message | ☐ |
| 4 | Click "Resend Verification" | New email sent | ☐ |
| 5 | Login with verified account | Successfully logged in | ☐ |

---

### Test Case 1.3: User Login
**Priority**: Critical

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to `/auth/login` | Login page loads | ☐ |
| 2 | Enter invalid credentials | "Invalid email or password" error | ☐ |
| 3 | Enter valid credentials | Successfully logged in | ☐ |
| 4 | Check session storage | `session` and `user` saved in localStorage | ☐ |
| 5 | Verify redirect | Redirected to dashboard | ☐ |
| 6 | Refresh page | Still logged in (session persists) | ☐ |
| 7 | Check "Remember Me" option | Session persists after browser close | ☐ |

---

### Test Case 1.4: Forgot Password
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Forgot Password" on login page | Redirected to forgot password page | ☐ |
| 2 | Enter unregistered email | "Email not found" error | ☐ |
| 3 | Enter registered email | "Reset link sent" message | ☐ |
| 4 | Check email | Password reset email received | ☐ |
| 5 | Click reset link | Redirected to reset password page | ☐ |
| 6 | Enter weak new password | Validation error shown | ☐ |
| 7 | Enter strong password twice | Password reset successful | ☐ |
| 8 | Login with new password | Login successful | ☐ |

---

### Test Case 1.5: Logout
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | While logged in, click logout | Logout confirmation modal appears | ☐ |
| 2 | Click "Cancel" | Modal closes, still logged in | ☐ |
| 3 | Click logout again, confirm | Logged out successfully | ☐ |
| 4 | Check localStorage | `session`, `user`, `token` removed | ☐ |
| 5 | Try to access protected route | Redirected to login page | ☐ |
| 6 | Use browser back button | Cannot access protected pages | ☐ |

---

### Test Case 1.6: Session Expired
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Login successfully | Dashboard loaded | ☐ |
| 2 | Wait for session to expire OR manually expire | - | ☐ |
| 3 | Try to make an API request | Session expired modal shown | ☐ |
| 4 | Click "Login Again" | Redirected to `/session-expired` page | ☐ |
| 5 | Login again | Redirected back to original page | ☐ |

---

### Test Case 1.7: Account Locked/Suspended
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Admin locks user account from admin panel | Account status updated | ☐ |
| 2 | Locked user tries to login | "Account locked" message shown | ☐ |
| 3 | User redirected to `/account-status?code=ACCOUNT_LOCKED` | Account status page shown | ☐ |
| 4 | Check support contact options | Support chat/email visible | ☐ |

---

## 💰 Part 2: Core Product Flows - Savings Plans

### Test Case 2.1: Start a New Plan
**Priority**: Critical  
**Business Rule**: Only one active plan allowed at a time

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Login as regular user | Dashboard displayed | ☐ |
| 2 | Navigate to "Start Saving" or Dashboard | Plan setup page or CTA visible | ☐ |
| 3 | Click "Start New Plan" | Plan configuration page loads | ☐ |
| 4 | View default settings | $27.40 daily shown as default | ☐ |
| 5 | Try to change daily amount | Validation error (predefined amount) | ☐ |
| 6 | View goal amount | 365 days × $27.40 = $10,001 shown | ☐ |

**Validation**:
- ✓ Default values match constants: `DAILY_SAVINGS_AMOUNT = 27.4`
- ✓ Goal calculation is correct
- ✓ No existing active plan for this user

---

### Test Case 2.2: Select Savings Mode
**Priority**: Critical

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | On plan setup, view mode options | "Aggressive" and "Balanced" modes shown | ☐ |
| 2 | Select "Aggressive" mode | Mode selected, details shown | ☐ |
| 3 | View mode description | Clear explanation of daily deductions | ☐ |
| 4 | Switch to "Balanced" mode | Mode changes, details update | ☐ |
| 5 | Confirm mode selection | Selected mode highlighted | ☐ |

**Modes to Test**:
- **Aggressive**: Daily automatic deduction
- **Balanced**: Weekly deduction reminder

---

### Test Case 2.3: Confirm and Activate Plan
**Priority**: Critical

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Review plan summary | All details correct | ☐ |
| 2 | Check wallet balance | Balance ≥ $27.40 to start | ☐ |
| 3 | If balance insufficient | "Add funds" prompt shown | ☐ |
| 4 | Click "Confirm & Start Plan" | Confirmation modal appears | ☐ |
| 5 | Accept terms and confirm | Plan activated successfully | ☐ |
| 6 | Check plan status in database | `status: 'active'`, `startDate: today` | ☐ |
| 7 | View dashboard | Plan details and progress shown | ☐ |
| 8 | Try to start another plan | "You already have an active plan" error | ☐ |

**Validation**:
- ✓ Only ONE active plan exists per user
- ✓ First day countdown timer starts
- ✓ Streak initialized at 0

---

### Test Case 2.4: Active Plan - Daily Deductions
**Priority**: Critical  
**Automated Process**: Runs at midnight via cron

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Plan is active | Status shown as "Active" | ☐ |
| 2 | Wait for midnight (or manually trigger cron) | Daily deduction processed | ☐ |
| 3 | Check wallet balance | $27.40 deducted from `availableBalance` | ☐ |
| 4 | Check locked balance | $27.40 added to `locked` balance | ☐ |
| 5 | Check transaction history | New transaction created | ☐ |
| 6 | Verify transaction details | Type: `daily_savings`, Amount: 27.40 | ☐ |
| 7 | Check streak | Streak incremented by 1 | ☐ |
| 8 | View progress bar | Progress updated (e.g., Day 1/365) | ☐ |

**Edge Case**: Insufficient balance
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | User has balance < $27.40 | Deduction fails | ☐ |
| 2 | Check notification | "Low balance" alert sent | ☐ |
| 3 | Check plan status | Remains "active" but flagged | ☐ |
| 4 | Check streak | Streak NOT incremented | ☐ |
| 5 | User adds funds | Next day deduction succeeds | ☐ |

**Validation**:
- ✓ Ledger integrity: Total balance unchanged, just moved from available to locked
- ✓ Transaction audit trail created
- ✓ Streak logic correct

---

### Test Case 2.5: Pause Plan
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to active plan page | "Pause Plan" button visible | ☐ |
| 2 | Click "Pause Plan" | Confirmation modal appears | ☐ |
| 3 | View pause warning | "Streak will freeze" message shown | ☐ |
| 4 | Confirm pause | Plan status changes to "paused" | ☐ |
| 5 | Check database | `status: 'paused'`, `pausedAt: timestamp` | ☐ |
| 6 | Wait for next midnight deduction | NO deduction processed | ☐ |
| 7 | Check streak | Streak frozen (not incremented or reset) | ☐ |
| 8 | View dashboard | "Paused" badge shown | ☐ |

**Edge Case**: Pause during pending payment
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Deduction initiated but pending | Transaction status: `pending` | ☐ |
| 2 | User pauses plan | Pause request queued | ☐ |
| 3 | Pending transaction completes | Transaction processed normally | ☐ |
| 4 | Plan pauses after transaction | Status updates to `paused` | ☐ |

---

### Test Case 2.6: Resume Plan
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Plan is paused | "Resume Plan" button visible | ☐ |
| 2 | Click "Resume Plan" | Confirmation modal appears | ☐ |
| 3 | Confirm resume | Plan status changes to "active" | ☐ |
| 4 | Check database | `status: 'active'`, `resumedAt: timestamp` | ☐ |
| 5 | Wait for next midnight | Deduction resumes normally | ☐ |
| 6 | Check streak | Streak continues from paused value | ☐ |

**Edge Case**: Resume after missed days
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Plan paused for 5 days | 5 days missed | ☐ |
| 2 | User resumes | "Missed days" notification shown | ☐ |
| 3 | Check catch-up options | Option to "Skip missed days" or "Catch up" | ☐ |
| 4 | User selects "Skip" | Plan continues from today | ☐ |
| 5 | User selects "Catch up" | Immediate deduction for missed days | ☐ |

---

### Test Case 2.7: Cancel Plan
**Priority**: Critical  
**Business Rule**: Cancelling stops ALL future deductions

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to plan settings | "Cancel Plan" button visible | ☐ |
| 2 | Click "Cancel Plan" | Warning modal appears | ☐ |
| 3 | View cancellation warning | "Progress will be lost" message shown | ☐ |
| 4 | Click "Cancel" in modal | Modal closes, no change | ☐ |
| 5 | Click "Cancel Plan" again | Modal reappears | ☐ |
| 6 | Type confirmation text | "CANCEL" required | ☐ |
| 7 | Confirm cancellation | Plan cancelled successfully | ☐ |
| 8 | Check database | `status: 'cancelled'`, `cancelledAt: timestamp` | ☐ |
| 9 | Wait for next midnight | NO deduction processed | ☐ |
| 10 | Check locked balance | Funds moved to `availableBalance` | ☐ |
| 11 | Check transaction history | "Plan cancelled" transaction recorded | ☐ |
| 12 | Try to resume cancelled plan | "Cannot resume cancelled plan" error | ☐ |

**Validation**:
- ✓ ALL future deductions stopped
- ✓ Locked funds released back to available
- ✓ Streak reset to 0
- ✓ Plan cannot be reactivated (must start new)

---

### Test Case 2.8: Complete Plan (365 Days)
**Priority**: Critical

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Plan reaches Day 365/365 | Completion detected | ☐ |
| 2 | Final deduction processes | Last $27.40 deducted | ☐ |
| 3 | Check plan status | Status changes to "completed" | ☐ |
| 4 | View completion celebration | 🎉 Celebration modal/animation appears | ☐ |
| 5 | Check total saved | $10,001 confirmed | ☐ |
| 6 | View completion certificate | Certificate/badge awarded | ☐ |
| 7 | Check locked balance | $10,001 in locked balance | ☐ |
| 8 | View withdrawal options | "Withdraw to bank" option shown | ☐ |
| 9 | Check achievements | "Completed 365-day challenge" badge | ☐ |
| 10 | View stats | Total saved, streak, start/end dates shown | ☐ |

**Validation**:
- ✓ Total saved = 365 × $27.40 = $10,001
- ✓ Completion celebration triggered
- ✓ Stats accurately recorded
- ✓ Achievement unlocked

---

### Test Case 2.9: Restart Plan
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Plan is completed or cancelled | "Start New Plan" button visible | ☐ |
| 2 | Click "Start New Plan" | Plan setup page loads | ☐ |
| 3 | Configure new plan | Fresh plan configuration | ☐ |
| 4 | Confirm and start | New plan created | ☐ |
| 5 | Check streak | Streak resets to 0 | ☐ |
| 6 | Check previous plan | Old plan still in history | ☐ |
| 7 | Verify plan count | New `planId` generated | ☐ |

**Validation**:
- ✓ Streak correctly reset to 0
- ✓ NEW plan record created (not overwriting old)
- ✓ Historical data preserved

---

## 💳 Part 3: Wallet & Transactions

### Test Case 3.1: View Wallet Balance
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to "My Wallet" | Wallet page loads | ☐ |
| 2 | View total balance | Total balance displayed | ☐ |
| 3 | View breakdown | Available, Locked, Referral shown | ☐ |
| 4 | Verify calculation | Total = Available + Locked + Referral | ☐ |
| 5 | Refresh page | Balance persists correctly | ☐ |

---

### Test Case 3.2: Add Money to Wallet
**Priority**: Critical

**Method 1: Bank Transfer (ACH)**
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Add Money" | Add money modal opens | ☐ |
| 2 | Enter amount < $10 | "Minimum $10" validation error | ☐ |
| 3 | Enter valid amount ($50) | Amount accepted | ☐ |
| 4 | Select "Bank Transfer" | Bank transfer option selected | ☐ |
| 5 | Select saved bank account | Account prefilled | ☐ |
| 6 | Confirm transfer | Processing... indicator shown | ☐ |
| 7 | Check transaction status | Status: "pending" | ☐ |
| 8 | Wait for processing (2-3 business days) | Status updates to "completed" | ☐ |
| 9 | Check wallet balance | $50 added to available balance | ☐ |
| 10 | Check fee | ACH fee: 0.8% capped at $5 | ☐ |

**Method 2: Card Payment (Instant)**
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Add Money" | Modal opens | ☐ |
| 2 | Enter amount ($100) | Amount accepted | ☐ |
| 3 | Select "Debit/Credit Card" | Card option selected | ☐ |
| 4 | Enter card details | Stripe card form shown | ☐ |
| 5 | Use test card: 4242 4242 4242 4242 | Card accepted | ☐ |
| 6 | Confirm payment | Processing... | ☐ |
| 7 | Payment succeeds | "Payment successful" message | ☐ |
| 8 | Check wallet immediately | $100 added instantly | ☐ |
| 9 | Check fee | Card fee: 2.9% + $0.30 = $3.20 | ☐ |
| 10 | View transaction | Transaction with fee breakdown | ☐ |

---

### Test Case 3.3: Withdraw from Wallet
**Priority**: Critical

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Withdraw" | Withdraw modal opens | ☐ |
| 2 | View available balance | Only `availableBalance` withdrawable | ☐ |
| 3 | Try to withdraw more than available | "Insufficient funds" error | ☐ |
| 4 | Enter valid amount ($200) | Amount accepted | ☐ |
| 5 | Select bank account | Verified bank account required | ☐ |
| 6 | If bank not verified | "Verify bank first" message | ☐ |
| 7 | Confirm withdrawal | Withdrawal request created | ☐ |
| 8 | Check pending withdrawals | Amount moved to `pendingWithdrawals` | ☐ |
| 9 | Check available balance | Reduced by withdrawal amount | ☐ |
| 10 | Wait for processing (2-3 days) | ACH payout initiated | ☐ |
| 11 | Check bank account | Funds received | ☐ |
| 12 | Check transaction status | Status: "completed" | ☐ |

**Edge Case**: Cancel pending withdrawal
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Withdrawal is pending | "Cancel" button visible | ☐ |
| 2 | Click "Cancel Withdrawal" | Confirmation modal | ☐ |
| 3 | Confirm cancellation | Withdrawal cancelled | ☐ |
| 4 | Check balances | Funds returned to `availableBalance` | ☐ |

---

### Test Case 3.4: View Transaction History
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to "Transactions" | Transaction list loads | ☐ |
| 2 | View recent transactions | Latest 10-20 transactions shown | ☐ |
| 3 | Check transaction details | Description, amount, date, status shown | ☐ |
| 4 | Filter by status ("Pending") | Only pending transactions shown | ☐ |
| 5 | Filter by type ("Deposits") | Only deposit transactions shown | ☐ |
| 6 | Search by amount | Relevant transactions shown | ☐ |
| 7 | Click "Export CSV" | CSV file downloaded | ☐ |
| 8 | Open CSV file | All transactions exported correctly | ☐ |
| 9 | Paginate through history | Older transactions load | ☐ |

---

### Test Case 3.5: Low Balance Alerts
**Priority**: Medium  
**Automated**: Runs daily at 10 AM

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | User has active plan | Plan requires $27.40 daily | ☐ |
| 2 | Available balance drops below 7 days worth | Balance < $191.80 | ☐ |
| 3 | Wait for 10 AM alert (or manual trigger) | Low balance alert sent | ☐ |
| 4 | Check in-app notifications | Alert shown in notification center | ☐ |
| 5 | Check email | Low balance email received | ☐ |
| 6 | View alert details | Recommended top-up amount shown | ☐ |
| 7 | Click "Add Funds" from alert | Redirected to add money page | ☐ |

**Critical Alert**: Balance < 3 days
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Balance < $82.20 (3 × $27.40) | Critical alert triggered | ☐ |
| 2 | Check notification | Red/urgent styling | ☐ |
| 3 | View message | "Risk of breaking streak" warning | ☐ |

---

## 🏦 Part 4: Payment Methods

### Test Case 4.1: Add Bank Account
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to "Payment Methods" | Payment methods page loads | ☐ |
| 2 | Click "Add Bank Account" | Bank account form appears | ☐ |
| 3 | Enter invalid routing number | Validation error | ☐ |
| 4 | Enter valid details | Account details accepted | ☐ |
| 5 | Submit form | "Verification required" message | ☐ |
| 6 | Check verification method | Microdeposit or instant verify shown | ☐ |
| 7 | Complete verification | Bank account verified | ☐ |
| 8 | View saved accounts | New account appears in list | ☐ |
| 9 | Set as default | "Default" badge shown | ☐ |

---

### Test Case 4.2: Add Card
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Add Card" | Card form appears (Stripe Elements) | ☐ |
| 2 | Enter test card: 4242 4242 4242 4242 | Card number accepted | ☐ |
| 3 | Enter invalid expiry | Validation error | ☐ |
| 4 | Enter valid expiry & CVC | Card details accepted | ☐ |
| 5 | Submit form | Card saved successfully | ☐ |
| 6 | View saved cards | New card shown (last 4 digits) | ☐ |
| 7 | Set as default | Default badge shown | ☐ |

---

### Test Case 4.3: Remove Payment Method
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | View payment methods list | All saved methods shown | ☐ |
| 2 | Click "Remove" on a method | Confirmation modal appears | ☐ |
| 3 | If it's default method  | "Set another as default first" error | ☐ |
| 4 | If it has pending transactions | "Cannot remove" warning | ☐ |
| 5 | Confirm removal | Method deleted | ☐ |
| 6 | Check Stripe dashboard | Payment method detached | ☐ |

---

## 👤 Part 5: User Profile & KYC

### Test Case 5.1: View Profile
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to "Profile" | Profile page loads | ☐ |
| 2 | View personal info | Name, email, phone displayed | ☐ |
| 3 | View KYC status | Status badge shown | ☐ |
| 4 | Check verification level | Current level indicated | ☐ |

---

### Test Case 5.2: Update Profile
**Priority**: Low

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Edit Profile" | Edit mode enabled | ☐ |
| 2 | Update name | Name field editable | ☐ |
| 3 | Try to change email | Verification required message | ☐ |
| 4 | Save changes | Profile updated | ☐ |
| 5 | Refresh page | Changes persisted | ☐ |

---

### Test Case 5.3: KYC Verification
**Priority**: Critical (for wallet features)

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | User not KYC verified | KYC prompt/banner shown | ☐ |
| 2 | Try to withdraw funds | "KYC required" error | ☐ |
| 3 | Click "Start KYC" | KYC form loads | ☐ |
| 4 | Upload invalid ID | "Invalid document" error | ☐ |
| 5 | Upload valid ID | Document accepted | ☐ |
| 6 | Enter SSN/Tax ID | Field validated | ☐ |
| 7 | Take selfie | Photo captured | ☐ |
| 8 | Submit KYC | "Under review" message | ☐ |
| 9 | Admin approves KYC | Status changes to "verified" | ☐ |
| 10 | Try withdrawal again | Withdrawal succeeds | ☐ |

---

## 🛡️ Part 6: Admin Panel

### Test Case 6.1: Admin Login
**Priority**: Critical

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to admin panel | Admin login page loads | ☐ |
| 2 | Try user credentials | Login fails | ☐ |
| 3 | Enter admin credentials | Login successful | ☐ |
| 4 | View admin dashboard | Admin dashboard loads | ☐ |
| 5 | Check role display | "System Admin" shown | ☐ |

---

### Test Case 6.2: User Management
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to "Users" | Users list loads | ☐ |
| 2 | Search for user by email | User found | ☐ |
| 3 | View user details | Complete profile shown | ☐ |
| 4 | Check user's plan | Plan details visible | ☐ |
| 5 | View user's transactions | Transaction history shown | ☐ |
| 6 | Lock user account | Account locked | ☐ |
| 7 | User tries to login | "Account locked" error | ☐ |
| 8 | Unlock account | Account unlocked | ☐ |

---

### Test Case 6.3: Transaction Monitoring
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to "Transactions" | All transactions listed | ☐ |
| 2 | Filter by date range | Filtered results shown | ☐ |
| 3 | Filter by status | Specific status shown | ☐ |
| 4 | View suspicious transactions | Flagged transactions highlighted | ☐ |
| 5 | Click on transaction | Full details modal opens | ☐ |
| 6 | Approve/Reject pending | Status updated | ☐ |

---

### Test Case 6.4: KYC Review
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to "KYC" | Pending KYC list shown | ☐ |
| 2 | Click on pending KYC | KYC details and docs shown | ☐ |
| 3 | View uploaded documents | Images load correctly | ☐ |
| 4 | Reject with reason | Rejection email sent to user | ☐ |
| 5 | Approve another KYC | User status updated to verified | ☐ |
| 6 | Check compliance log | Action logged | ☐ |

---

## ⚠️ Part 7: Edge Cases & Error Handling

### Test Case 7.1: Network Errors
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Disconnect internet | Error message shown | ☐ |
| 2 | Try to submit form | "No internet connection" | ☐ |
| 3 | Reconnect internet | App recovers gracefully | ☐ |
| 4 | Retry action | Action succeeds | ☐ |

---

### Test Case 7.2: Server Errors
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Backend returns 500 error | "Server error" message shown | ☐ |
| 2 | User-friendly message displayed | No technical jargon | ☐ |
| 3 | Retry button available | Retry action possible | ☐ |

---

### Test Case 7.3: Concurrent Plan Operations
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | User has active plan | Status: active | ☐ |
| 2 | Open app in 2 browser tabs | Both tabs show same plan | ☐ |
| 3 | Pause plan in Tab 1 | Plan paused | ☐ |
| 4 | Try to pause again in Tab 2 | "Already paused" message | ☐ |
| 5 | Resume in Tab 1 | Plan active | ☐ |
| 6 | Refresh Tab 2 | Shows updated status | ☐ |

---

### Test Case 7.4: Race Conditions
**Priority**: High

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | User has $27.40 available | Just enough for one deduction | ☐ |
| 2 | Midnight deduction starts | Amount deducted | ☐ |
| 3 | User clicks "Withdraw All" simultaneously | One operation completes | ☐ |
| 4 | Check final balance | No negative balance | ☐ |
| 5 | Check transaction log | Only one transaction succeeded | ☐ |

---

### Test Case 7.5: Data Validation
**Priority**: Medium

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Enter SQL injection in search | Input sanitized | ☐ |
| 2 | Enter XSS script in name field | Script blocked | ☐ |
| 3 | Upload 100MB+ file | "File too large" error | ☐ |
| 4 | Enter special characters in amount | Validation error | ☐ |

---

## 📊 Part 8: Performance & Usability

### Test Case 8.1: Page Load Times
**Priority**: Low

| Page | Target | Actual | Status |
|------|--------|--------|--------|
| Login | <2s | ___s | ☐ |
| Dashboard | <3s | ___s | ☐ |
| Transactions | <2s | ___s | ☐ |
| My Wallet | <2s | ___s | ☐ |

---

### Test Case 8.2: Responsive Design
**Priority**: Medium

| Device | Screen Size | Status |
|--------|------------|--------|
| Desktop | 1920×1080 | ☐ |
| Laptop | 1366×768 | ☐ |
| Tablet | 768×1024 | ☐ |
| Mobile | 375×667 | ☐ |

**Test on each device**:
- [ ] Navigation works
- [ ] Buttons are clickable
- [ ] Text is readable
- [ ] Forms are usable
- [ ] Modals display correctly

---

### Test Case 8.3: Browser Compatibility
**Priority**: Low

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ☐ |
| Firefox | Latest | ☐ |
| Safari | Latest | ☐ |
| Edge | Latest | ☐ |

---

## 📝 Test Execution Summary

### Critical Issues Found
| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | | | | |
| 2 | | | | |

### Medium Priority Issues
| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | | | | |

### Low Priority Issues
| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | | | | |

---

## ✅ Sign-off

### Test Results
- **Total Test Cases**: 60+
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___
- **Not Tested**: ___

### Ready for Production?
- [ ] All critical test cases passed
- [ ] No high-severity bugs remaining
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Documentation complete

**Tested By**: ________________  
**Date**: ________________  
**Signature**: ________________

---

## 📌 Quick Test Checklist (Smoke Test)

Use this for quick regression testing:

- [ ] User can sign up
- [ ] User can login
- [ ] User can start a plan
- [ ] Daily deduction works
- [ ] User can add money
- [ ] User can withdraw money
- [ ] User can pause/resume plan
- [ ] User can cancel plan
- [ ] Completion celebration works
- [ ] Admin can login
- [ ] Admin can view users
- [ ] Admin can approve KYC
- [ ] All critical pages load without errors
- [ ] No console errors on main flows

---

## 🔗 Related Documents

- [SAVE2740_AUTOMATION_AUDIT.md](./SAVE2740_AUTOMATION_AUDIT.md) - System architecture
- [AUTOMATION_QUICK_START.md](./AUTOMATION_QUICK_START.md) - Deployment guide
- [SESSION_FIXES_SUMMARY.md](./SESSION_FIXES_SUMMARY.md) - Recent bug fixes

---

**Last Updated**: February 2, 2026  
**Version**: 1.0
