# Frontend-Backend Separation Implementation Guide

## Overview
This document outlines the steps completed and remaining to fully separate the Next.js monolith into frontend and backend services.

## ✅ Completed Steps

### 1. Backend Infrastructure Created
- ✅ Created `backend/` directory structure
- ✅ Set up Express.js application (`src/app.ts`)
- ✅ Created server entry point (`src/server.ts`)
- ✅ Configured TypeScript (`tsconfig.json`)
- ✅ Added package.json with dependencies
- ✅ Set up environment variables (`.env` and `.env.example`)

### 2. Backend Core Files
- ✅ Database configuration (`src/config/db.ts`)
- ✅ Authentication middleware (`src/middleware/auth.ts`)
- ✅ Error handling middleware (`src/middleware/error-handler.ts`)

### 3. Code Migration
- ✅ Copied all models from `lib/models/` to `backend/src/models/`
- ✅ Copied all services from `lib/services/` to `backend/src/services/`
- ✅ Copied utilities (`auth-utils.ts`, `email-service.ts`, etc.) to `backend/src/utils/`
- ✅ Copied types from `lib/types/` to `backend/src/types/`

### 4. Routes Created
- ✅ Implemented full auth routes (`src/routes/auth.routes.ts`)
  - Signup, login, logout
  - Email verification
  - Password reset
  - Get current user
- ✅ Created placeholder route files for all other endpoints:
  - dashboard, wallet, groups, referrals
  - save2740, saver-pockets, payments
  - payment-methods, notifications, fees
  - kyc, support, support-chat, account
  - daily-savings, quote-of-day, health
  - webhooks, banking

### 5. Frontend Updates
- ✅ Updated `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5000`
- ✅ Existing API client (`lib/api-client.ts`) already supports configurable base URL

## 🔄 In Progress

### Backend Dependencies Installation
- Running `npm install` in backend directory
- Installing Express, TypeScript, MongoDB, JWT, and other dependencies

## 📋 Remaining Tasks

### Phase 1: Complete Backend Routes (HIGH PRIORITY)

Each route file needs to be implemented by migrating logic from `app/api/**`:

#### Critical Routes (Implement First)
1. **Profile Routes** (`profile.routes.ts`)
   - Migrate from `app/api/profile/route.ts`
   - GET /api/profile - Get user profile
   - PUT /api/profile - Update profile

2. **Dashboard Routes** (`dashboard.routes.ts`)
   - Migrate from `app/api/dashboard/*`
   - GET /api/dashboard/overview
   - GET /api/dashboard/stats
   - GET /api/dashboard/streak
   - GET /api/dashboard/achievements
   - GET /api/dashboard/contribution
   - GET /api/dashboard/savings-breakdown
   - GET /api/dashboard/projections

3. **Wallet Routes** (`wallet.routes.ts`)
   - Migrate from `app/api/wallet/*`
   - GET /api/wallet - Get wallet
   - GET /api/wallet/transactions
   - POST /api/wallet/deposit
   - POST /api/wallet/withdraw

4. **Groups Routes** (`groups.routes.ts`)
   - Migrate from `app/api/groups/*`
   - GET /api/groups - List user groups
   - POST /api/groups - Create group
   - GET /api/groups/:id - Get group details
   - PUT /api/groups/:id - Update group
   - POST /api/groups/:id/join - Join group

5. **Referrals Routes** (`referrals.routes.ts`)
   - Migrate from `app/api/referrals/*`
   - GET /api/referrals - Get referral data
   - POST /api/referrals/verify - Verify referral code

#### Secondary Routes
6. **Save2740 Routes** (`save2740.routes.ts`)
7. **Saver Pockets Routes** (`saver-pockets.routes.ts`)
8. **Payments Routes** (`payments.routes.ts`)
9. **Payment Methods Routes** (`payment-methods.routes.ts`)
10. **Notifications Routes** (`notifications.routes.ts`)
11. **Fees Routes** (`fees.routes.ts`)
12. **KYC Routes** (`kyc.routes.ts`)
13. **Support Routes** (`support.routes.ts` + `support-chat.routes.ts`)
14. **Account Routes** (`account.routes.ts`)
15. **Daily Savings Routes** (`daily-savings.routes.ts`)
16. **Quote Routes** (`quote-of-day.routes.ts`)
17. **Health Routes** (`health.routes.ts`)
18. **Webhooks Routes** (`webhooks.routes.ts`)
19. **Banking Routes** (`banking.routes.ts`)

### Phase 2: Frontend API Integration Updates

#### Update API Calls Throughout Frontend
Most components likely make direct API calls using fetch or the existing api-client. Need to verify they use the API client correctly.

#### Files Likely Needing Updates:
1. **Authentication Context/Hooks**
   - Verify auth flows use the API client
   - Update token storage/retrieval
   - Ensure proper error handling

2. **Page Components** (in `app/`)
   - Dashboard pages
   - Profile pages
   - Wallet pages
   - Group contribution pages
   - All data-fetching pages

3. **Client Components** (in `components/`)
   - Any components that fetch data directly
   - Forms that submit to API

#### Specific Updates Needed:
- Replace any direct `/api/*` fetch calls with API client
- Update authentication to pass JWT token via Authorization header
- Handle CORS properly
- Update file uploads if any
- Test all forms and data submissions

### Phase 3: Remove Unnecessary Backend Code from Frontend

Once backend is fully functional, clean up frontend:

1. **Delete API Routes**
   - Remove `app/api/` directory entirely

2. **Delete Server-Side Libraries**
   - Remove from frontend package.json:
     - `mongoose`
     - `mongodb`
     - `bcryptjs`
     - `jsonwebtoken`
     - `nodemailer`
     - `stripe` (backend library)
   - Keep only:
     - `@stripe/stripe-js` (client library)
     - `@stripe/react-stripe-js`

3. **Delete Server Utilities**
   - Remove `lib/db.ts`
   - Remove `lib/auth-utils.ts` (server-side portions)
   - Remove `lib/email-service.ts`
   - Remove `lib/payment-processor.ts`
   - Remove `lib/wallet-service.ts`
   - Remove `lib/wallet-ledger.ts`
   - Remove `middleware.ts` (if backend handles this)

4. **Keep Client-Side Code**
   - All components
   - All page files
   - Client-side hooks
   - UI utilities
   - Context providers

### Phase 4: Testing

#### Backend Testing
1. Test all API endpoints with Postman/Insomnia
2. Verify authentication works
3. Test database operations
4. Check error handling
5. Verify CORS configuration

#### Frontend Testing
1. Test complete authentication flow
2. Verify all data fetching works
3. Test all forms and submissions
4. Check file uploads
5. Test error states
6. Verify loading states

#### Integration Testing
1. End-to-end user journeys
2. Token expiry handling
3. Error recovery
4. Network failure scenarios

### Phase 5: Deployment Preparation

#### Backend Deployment (Choose one)
- **AWS EC2**: Install Node.js, MongoDB, set up PM2
- **Railway**: Connect repo, set environment variables
- **Heroku**: Install Heroku CLI, configure buildpacks
- **Render**: Connect repo, configure build command
- **DigitalOcean**: App Platform or Droplet

Update backend `.env` for production:
```env
PORT=5000 (or assigned port)
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=your-production-mongodb-url
JWT_SECRET=strong-production-secret
```

#### Frontend Deployment (Vercel recommended)
- Deploy to Vercel (existing Next.js deployment)
- Update environment variables:
  ```env
  NEXT_PUBLIC_API_URL=https://your-backend-domain.com
  NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
  ```

### Phase 6: Final Verification

- [ ] Backend runs independently (port 5000)
- [ ] Frontend runs independently (port 3000)
- [ ] All API calls go to backend
- [ ] Authentication works end-to-end
- [ ] All features functional
- [ ] No console errors
- [ ] UI completely unchanged
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Production deployments successful

## Quick Start Guide

### Start Backend (Development)
```bash
cd backend
npm install  # if not already done
npm run dev
```
Backend will run on `http://localhost:5000`

### Start Frontend (Development)
```bash
# From project root
npm run dev
```
Frontend will run on `http://localhost:3000`

### Testing the Separation
1. Start both servers
2. Open `http://localhost:3000`
3. Try to sign up / log in
4. Check browser Network tab - API calls should go to `localhost:5000`
5. Verify the UI looks exactly the same

## Migration Assistant Script

To speed up route migration, use this template for each route:

```typescript
// Example: migrating dashboard routes
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
// Import models, services, utilities as needed

const router = express.Router();

// Paste the route handler from app/api/dashboard/overview/route.ts
router.get
('/overview', authenticateToken, async (req: AuthRequest, res) => {
  // 1. Remove NextRequest, NextResponse imports
  // 2. Replace NextResponse.json() with res.json()
  // 3. Replace req.json() with req.body (for POST)
  // 4. Use req.userId from authenticateToken middleware
  // 5. Use res.status(code).json({ ... }) for responses
});

export default router;
```

## Notes

### Important Considerations
1. **No UI Changes**: The entire UI must remain identical
2. **API Contracts**: Request/response formats must stay the same
3. **Authentication**: JWT tokens via Authorization header
4. **CORS**: Backend must allow frontend domain
5. **Error Handling**: Consistent error responses
6. **Environment Vars**: Properly configured for dev and production

### Potential Issues
1. **Cookie-based auth**: May need adjustment for separate domains
2. **File uploads**: Might need multipart/form-data handling
3. **WebSocket/SSE**: If used, needs separate configuration
4. **Rate limiting**: May behave differently
5. **Session storage**: May need Redis for distributed sessions

## Getting Help

If you encounter issues:
1. Check backend logs (`npm run dev` output)
2. Check browser console for errors
3. Check Network tab for failed requests
4. Verify environment variables are correct
5. Ensure both servers are running
6. Check CORS configuration if seeing CORS errors

## Success Metrics

- ✅ Backend starts without errors
- ✅ Frontend starts without errors
- ✅ Can sign up new user
- ✅ Can log in existing user
- ✅ Can fetch user profile
- ✅ Can access dashboard
- ✅ All features work as before
- ✅ UI is pixel-perfect identical
- ✅ No breaking changes

## Timeline Estimate

- **Backend Routes Implementation**: 6-8 hours
- **Frontend API Integration Verification**: 2-3 hours
- **Testing**: 2-3 hours
- **Cleanup**: 1 hour
- **Deployment Setup**: 2-3 hours
- **Total**: ~15-20 hours

## Current Status: 30% Complete

- ✅ Infrastructure setup
- ✅ Core middleware
- ✅ Auth routes complete
- 🔄 Other routes (0/18 complete)
- ⏳ Frontend integration
- ⏳ Testing
- ⏳ Deployment
