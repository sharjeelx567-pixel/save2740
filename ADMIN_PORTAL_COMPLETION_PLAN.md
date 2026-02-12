# SuperAdmin Admin Portal Completion Plan

This plan outlines the steps to deliver a production-grade SuperAdmin Admin Portal with strict control over money movement, compliance, and security.

## 🛠 Phase 1: Institutional Controls & Security (Audit & RBAC)
- [ ] **Audit Log Enhancements**:
    - Add `group` and `system` to `resourceType` enum in `AuditLog` model.
    - Ensure EVERY sensitive admin action (lock, freeze, refund, approve) calls the `createAuditLog` utility.
- [ ] **Admin MFA Implementation**:
    - Add `mfaSecret` and `mfaEnabled` to `Admin` model.
    - Implement TOTP verification during admin login.
- [ ] **Roles & Permissions**:
    - Implement granular permission checks (e.g., `Finance`, `Support`, `Compliance`) in addition to basic `SUPER_ADMIN`.

## 🏦 Phase 2: Osusu Groups Control Center
- [ ] **Backend Admin Group Routes**:
    - `GET /api/admin/groups` - List all groups with status filters.
    - `GET /api/admin/groups/:id` - Detailed view (members, rounds, ledger).
    - `POST /api/admin/groups/:id/freeze` - Global freeze on group activity.
    - `POST /api/admin/groups/:id/unfreeze` - Resume group activity.
    - `POST /api/admin/groups/:id/remove-member` - Remove a member with a reason.
- [ ] **Frontend Group Pages**:
    - Create `/groups` list view.
    - Create `/groups/[id]` detail view with membership and round management.

## 👤 Phase 3: Enhanced User & Wallet Management
- [ ] **User Details Upgrade**:
    - UI: Mask PII (Phone/Email) by default (toggle to reveal).
    - Features: Add internal notes section (Immutable).
    - Features: Add "Freeze Wallet" separate from "Lock Account".
- [ ] **KYC Queue Upgrade**:
    - UI: SLA timer and priority markers.
    - Features: Template-based rejection reasons.

## 💸 Phase 4: Payouts & Money Movement
- [ ] **Payout Queue**:
    - `GET /api/admin/payouts` - View all scheduled group payouts.
    - Implement **Global Kill Switch** in `SystemConfig` to pause all payouts.
- [ ] **Two-step Approval**:
    - Logic for "Finance Approval" before payout execution.

## 🏥 Phase 5: Reporting & System Health
- [ ] **Reporting Engine**:
    - Export ledger to CSV/PDF.
    - Daily financial summary report.
- [ ] **System Dashboard**:
    - Provider health monitoring (Stripe, Twilio, etc.).
    - System uptime and error reporting.

## ✅ Mandatory "Done" Criteria
- [x] Login/Logout (Backend/Frontend)
- [ ] Freeze User / Wallet (Reason required)
- [ ] Freeze Group (Reason required)
- [ ] Pause Payouts (Global Kill Switch)
- [ ] KYC Approve/Reject (Audit logged)
- [ ] Transaction Ledger (Searchable & Traceable)
- [ ] RBAC + MFA for Admin
