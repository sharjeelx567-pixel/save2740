# Frontend-Backend Separation Plan

## Overview
Separate the Next.js monolith into:
1. **Frontend**: Next.js app (UI only)
2. **Backend**: Express.js REST API server

## Current Architecture Analysis

### Current Stack
- **Framework**: Next.js 16.0.10
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (jsonwebtoken + bcrypt)
- **Email**: Nodemailer
- **Payments**: Stripe
- **UI**: React 19 + Radix UI + Tailwind CSS

### API Routes Identified
```
/api/account/*
/api/auth/*
/api/banking/*
/api/daily-savings/*
/api/dashboard/*
/api/fees/*
/api/groups/*
/api/health/*
/api/kyc/*
/api/notifications/*
/api/payment-methods/*
/api/payments/*
/api/profile/*
/api/quote-of-day/*
/api/referrals/*
/api/save2740/*
/api/saver-pockets/*
/api/support/*
/api/support-chat/*
/api/wallet/*
/api/webhooks/*
```

## Implementation Steps

### Phase 1: Backend Service Creation

#### 1.1 Create Backend Directory Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   └── cors.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── error-handler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── account.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── banking.routes.ts
│   │   ├── daily-savings.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── fees.routes.ts
│   │   ├── groups.routes.ts
│   │   ├── health.routes.ts
│   │   ├── kyc.routes.ts
│   │   ├── notifications.routes.ts
│   │   ├── payment-methods.routes.ts
│   │   ├── payments.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── quote-of-day.routes.ts
│   │   ├── referrals.routes.ts
│   │   ├── save2740.routes.ts
│   │   ├── saver-pockets.routes.ts
│   │   ├── support.routes.ts
│   │   ├── support-chat.routes.ts
│   │   ├── wallet.routes.ts
│   │   └── webhooks.routes.ts
│   ├── controllers/
│   │   └── (mirror routes structure)
│   ├── models/
│   │   └── (copy from lib/models)
│   ├── services/
│   │   └── (copy from lib/services)
│   ├── utils/
│   │   └── (copy utility functions)
│   ├── types/
│   │   └── (copy type definitions)
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

#### 1.2 Backend Dependencies
```json
{
  "express": "^5.2.1",
  "cors": "^2.8.5",
  "helmet": "^8.0.0",
  "morgan": "^1.10.0",
  "mongoose": "^8.0.0",
  "mongodb": "^6.0.0",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "nodemailer": "^7.0.12",
  "stripe": "^20.1.0",
  "dotenv": "^17.2.3",
  "zod": "3.25.76"
}
```

### Phase 2: Backend Implementation

#### 2.1 Move Server Logic
- Copy all API route handlers from `app/api/*`
- Move models from `lib/models/*`
- Move services from `lib/services/*`
- Move utilities: `lib/auth-utils.ts`, `lib/db-utils.ts`, `lib/email-service.ts`, etc.

#### 2.2 Create Express Routes
- Convert Next.js API routes to Express routes
- Maintain exact same endpoint structure
- Keep request/response formats identical

#### 2.3 Setup Middleware
- JWT authentication middleware
- Error handling middleware
- CORS configuration
- Request validation

### Phase 3: Frontend Updates

#### 3.1 Environment Variables
Create `.env.local` with:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

#### 3.2 API Client Setup
Create `lib/api-client.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  get: (endpoint) => fetch(`${API_URL}${endpoint}`),
  post: (endpoint, data) => fetch(`${API_URL}${endpoint}`, { method: 'POST', body: JSON.stringify(data) }),
  // ... etc
};
```

#### 3.3 Replace API Calls
- Replace all direct API route calls with fetch/axios calls to backend
- Update authentication to use API tokens
- Handle CORS properly
- Keep all UI components unchanged

### Phase 4: Migration Checklist

#### Files to Move to Backend:
- [x] `app/api/**/*.ts` → `backend/src/routes/`
- [x] `lib/models/**/*` → `backend/src/models/`
- [x] `lib/services/**/*` → `backend/src/services/`
- [x] `lib/auth-utils.ts` → `backend/src/utils/`
- [x] `lib/db-utils.ts` → `backend/src/utils/`
- [x] `lib/db.ts` → `backend/src/config/`
- [x] `lib/mongodb.ts` → `backend/src/config/`
- [x] `lib/email-service.ts` → `backend/src/services/`
- [x] `lib/payment-processor.ts` → `backend/src/services/`
- [x] `lib/stripe.ts` → `backend/src/config/`
- [x] `lib/wallet-service.ts` → `backend/src/services/`
- [x] `lib/wallet-ledger.ts` → `backend/src/services/`
- [x] `middleware.ts` → `backend/src/middleware/`

#### Files to Keep in Frontend:
- [x] All `app/**/*.tsx` pages
- [x] All `components/**/*`
- [x] All `hooks/**/*`
- [x] `context/**/*`
- [x] `styles/**/*`
- [x] Client-side utilities in `lib/utils.ts`

#### Files to Update in Frontend:
- [x] All pages that fetch data
- [x] All components that make API calls
- [x] Authentication context
- [x] Environment configuration

### Phase 5: Testing Strategy

1. **Backend Testing**
   - Test all API endpoints with Postman/Insomnia
   - Verify authentication works
   - Check database operations
   - Test error handling

2. **Frontend Testing**
   - Verify all pages load correctly
   - Test user authentication flow
   - Check all API integrations
   - Ensure UI remains unchanged

3. **Integration Testing**
   - Complete user journey testing
   - Verify CORS configuration
   - Test production builds
   - Performance testing

## Environment Variables

### Backend `.env`
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB
DATABASE_URL=mongodb+srv://...
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=...
CRON_SECRET=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Dwolla
DWOLLA_APP_KEY=...
DWOLLA_APP_SECRET=...
DWOLLA_ENVIRONMENT=sandbox
```

### Frontend `.env.local`
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (public key only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## Deployment Strategy

### Backend Deployment
- Deploy to AWS EC2 / Railway / Heroku / Render
- Setup environment variables
- Configure MongoDB connection
- Enable CORS for frontend domain
- Setup SSL certificate

### Frontend Deployment
- Deploy to Vercel / Netlify
- Set NEXT_PUBLIC_API_URL to backend URL
- Configure environment variables
- Test API connectivity

## Critical Rules

1. **NO UI CHANGES**: Do not modify any component structure, styling, or layout
2. **NO JSX CHANGES**: Except for API call replacements
3. **MAINTAIN API CONTRACTS**: Keep request/response formats identical
4. **PRESERVE ROUTES**: Keep all page routes unchanged
5. **KEEP ENVIRONMENT VARS**: Use NEXT_PUBLIC_API_URL for all API calls

## Success Criteria

- [ ] Backend runs independently on port 5000
- [ ] Frontend runs independently on port 3000
- [ ] All API endpoints migrated and functional
- [ ] Authentication works across services
- [ ] UI remains 100% unchanged
- [ ] All features work as before
- [ ] No console errors
- [ ] Production ready
