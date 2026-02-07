# Admin Panel - API Client Architecture

## ✅ Complete Separation: Frontend-Only Application

### Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (User Application)                             │
│  Port: 3000                                              │
│  Stack: Next.js/React                                    │
│  Communication: Backend API with User JWT                │
└──────────────────────────────────────────────────────────┘
                         ↓ HTTP (User JWT)
┌──────────────────────────────────────────────────────────┐
│  BACKEND (API Server - SINGLE SOURCE OF TRUTH)           │
│  Port: 5000                                              │
│  Stack: Express/Node.js                                  │
│  Database: Direct MongoDB connection                     │
│  Auth: JWT (User + Admin authentication)                 │
│  Routes:                                                 │
│    - /api/auth/*          (User auth)                    │
│    - /api/user/*          (User operations)              │
│    - /api/admin/auth/*    (Admin auth)                   │
│    - /api/admin/*         (Admin operations)             │
└──────────────────────────────────────────────────────────┘
                         ↑ HTTP (Admin JWT)
┌──────────────────────────────────────────────────────────┐
│  ADMIN PANEL (Frontend-Only Application)                 │
│  Port: 3001                                              │
│  Stack: Next.js/React                                    │
│  ❌ NO Database Access                                   │
│  ❌ NO Business Logic                                    │
│  ❌ NO API Routes (Next.js)                              │
│  Communication: Backend API with Admin JWT               │
└──────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Architecture Principles

### 1. **Backend = API Only**

✅ **What Backend Contains:**
- Express routes, controllers, middleware
- Database models (Mongoose)
- Business logic and validation
- JWT token generation/verification
- Direct MongoDB connection
- Admin authentication endpoints

❌ **What Backend Does NOT Have:**
- UI components or pages
- Admin panel views
- Frontend code

### 2. **Admin Panel = UI Only**

✅ **What Admin Panel Contains:**
- React components and pages
- Forms, tables, dashboards
- API client to consume backend
- Admin JWT token storage (localStorage)
- Client-side routing

❌ **What Admin Panel Does NOT Have:**
- Database connection or models
- Business logic or controllers
- Next.js API routes
- JWT token verification (backend handles this)

### 3. **Communication Pattern**

```typescript
// Admin Panel sends requests to Backend
fetch('http://localhost:5000/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${adminJWT}`
  }
})

// Backend verifies admin JWT and returns data
// Admin Panel displays data
```

---

## 📁 Correct Project Structure

### Admin Panel (Frontend-Only)

```
admin-panel/
├── .env.local                   # Backend API URL only
│   NEXT_PUBLIC_API_URL=http://localhost:5000/api
│
├── package.json                 # No mongoose, bcrypt, etc.
│
├── lib/
│   ├── api.ts                  # HTTP client (fetch wrapper)
│   ├── auth.ts                 # Token storage/decode (NO verification)
│   └── services/               # API client services
│       ├── dashboard.service.ts  → Calls /api/admin/dashboard/*
│       ├── users.service.ts      → Calls /api/admin/users/*
│       ├── kyc.service.ts        → Calls /api/admin/kyc/*
│       └── wallets.service.ts    → Calls /api/admin/wallets/*
│
├── app/
│   ├── dashboard/page.tsx
│   ├── users/page.tsx
│   ├── kyc/page.tsx
│   └── login/page.tsx
│
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── layout/                 # Layout components
│   └── auth/ProtectedRoute.tsx
│
└── contexts/
    └── AuthContext.tsx         # Client-side auth state
```

### Backend (API Server)

```
backend/
├── src/
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── auth.routes.ts      # POST /api/admin/auth/login
│   │   │   │                       # GET  /api/admin/auth/me
│   │   │   └── dashboard.routes.ts # GET  /api/admin/dashboard/stats
│   │   │                           # GET  /api/admin/dashboard/activity
│   │   ├── admin.routes.ts         # GET  /api/admin/users
│   │   │                           # GET  /api/admin/kyc/:userId
│   │   │                           # POST /api/admin/kyc/approve
│   │   └── auth.routes.ts          # User authentication
│   │
│   ├── models/
│   │   ├── auth.model.ts           # User model (with admin role)
│   │   ├── wallet.model.ts
│   │   ├── transaction.ts
│   │   └── kyc-document.ts
│   │
│   ├── controllers/
│   ├── middleware/
│   │   └── auth.ts                 # authenticateAdmin middleware
│   │
│   └── config/
│       └── db.ts                   # MongoDB connection
```

---

## 🔐 Authentication Flow

### Admin Login Flow

1. **Admin enters credentials in Admin Panel UI**
   ```
   Admin Panel (Login Page)
   ```

2. **Admin Panel sends login request to Backend**
   ```typescript
   POST http://localhost:5000/api/admin/auth/login
   Body: { email, password }
   ```

3. **Backend validates credentials and returns JWT**
   ```typescript
   // Backend verifies admin credentials from database
   // Returns JWT with admin role
   Response: {
     success: true,
     data: {
       accessToken: "eyJhbGc...",
       user: { id, email, role: "admin" }
     }
   }
   ```

4. **Admin Panel stores JWT and uses it for subsequent requests**
   ```typescript
   localStorage.setItem('admin_token', accessToken)
   
   // All future requests include this token
   fetch('/api/admin/users', {
     headers: { 'Authorization': `Bearer ${accessToken}` }
   })
   ```

---

## 🚫 What NOT to Do

### ❌ **DO NOT** Create Next.js API Routes in Admin Panel

```typescript
// ❌ WRONG: admin-panel/app/api/users/route.ts
import connectDB from '@/lib/db'
export async function GET() {
  await connectDB()
  const users = await User.find()  // Direct DB access
  return Response.json(users)
}
```

### ❌ **DO NOT** Access Database from Admin Panel

```typescript
// ❌ WRONG: admin-panel/lib/db.ts
import mongoose from 'mongoose'
export async function connectDB() {
  return mongoose.connect(MONGODB_URI)
}
```

### ❌ **DO NOT** Create Models in Admin Panel

```typescript
// ❌ WRONG: admin-panel/lib/models/User.ts
import mongoose from 'mongoose'
export const User = mongoose.model('User', UserSchema)
```

---

## ✅ What TO Do

### ✅ **Create API Client Services**

```typescript
// ✅ CORRECT: admin-panel/lib/services/users.service.ts
import { api } from '../api'

export const usersService = {
  getUsers: async (params) => {
    return api.get(`/admin/users?${query}`)
  },
  
  lockUser: async (id) => {
    return api.patch(`/admin/users/${id}/lock`)
  }
}
```

### ✅ **Use API Client in Components**

```typescript
// ✅ CORRECT: admin-panel/app/users/page.tsx
import { usersService } from '@/lib/services/users.service'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    usersService.getUsers({ page: 1 }).then(setUsers)
  }, [])
  
  return <UserTable users={users} />
}
```

### ✅ **Store Only JWT Token**

```typescript
// ✅ CORRECT: admin-panel/lib/api.ts
export const tokenManager = {
  get: () => localStorage.getItem('admin_token'),
  set: (token) => localStorage.setItem('admin_token', token),
  remove: () => localStorage.removeItem('admin_token')
}
```

---

## 📊 Data Flow Example

### Viewing Dashboard Stats

```
1. Admin Panel Page Loads
   ├─> admin-panel/app/dashboard/page.tsx
   │
2. Component Calls Service
   ├─> dashboardService.getStats()
   │
3. Service Makes HTTP Request
   ├─> GET http://localhost:5000/api/admin/dashboard/stats
   │   Headers: { Authorization: "Bearer <admin_jwt>" }
   │
4. Backend Receives Request
   ├─> backend/src/routes/admin/dashboard.routes.ts
   │   ├─> authenticateToken middleware verifies JWT
   │   ├─> Checks if user has admin role
   │   ├─> Queries MongoDB for stats
   │   └─> Returns JSON response
   │
5. Admin Panel Receives Data
   ├─> Component updates state
   └─> UI renders dashboard stats
```

---

## 🎯 Benefits of This Architecture

1. **Clear Separation of Concerns**
   - Backend: Business logic and data
   - Admin Panel: UI and presentation

2. **Single Source of Truth**
   - All business logic in one place (backend)
   - Easier to maintain and test

3. **Security**
   - No database credentials in frontend
   - Backend validates all operations
   - JWT tokens expire and can be revoked

4. **Scalability**
   - Backend can serve multiple frontends
   - Easy to add mobile admin app
   - Frontend and backend can scale independently

5. **Development**
   - Frontend and backend teams can work independently
   - Clear API contract
   - Easy to test with mock APIs

---

## 🔍 Quick Checklist

Use this checklist to verify your admin panel follows the correct architecture:

- [ ] ❌ No `lib/db.ts` file
- [ ] ❌ No `lib/models/` folder
- [ ] ❌ No `app/api/` folder with route handlers
- [ ] ❌ No `mongoose` in `package.json`
- [ ] ❌ No `bcryptjs` in `package.json`
- [ ] ✅ Has `lib/api.ts` with HTTP client
- [ ] ✅ Has `lib/services/` with API client services
- [ ] ✅ All services call backend URLs
- [ ] ✅ JWT stored in localStorage
- [ ] ✅ Components use services to fetch data

---

## 🚀 Running the Applications

```bash
# Terminal 1: Backend API Server
cd backend
npm run dev  # Runs on http://localhost:5000

# Terminal 2: Admin Panel UI
cd admin-panel
npm run dev  # Runs on http://localhost:3001

# Terminal 3: User Frontend
cd frontend
npm run dev  # Runs on http://localhost:3000
```

All three applications are separate and communicate over HTTP.
