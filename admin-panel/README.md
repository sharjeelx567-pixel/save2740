# Save 2740 - Admin Panel

## 🎯 Frontend-Only Admin Application

This is the **admin UI** for the Save 2740 application. It is a **frontend-only** Next.js application that consumes the backend API.

**Key Architecture:**
- ❌ NO database access
- ❌ NO business logic
- ❌ NO API routes (Next.js)
- ✅ Pure UI application
- ✅ Consumes backend API over HTTP
- ✅ Admin JWT authentication

---

## 📋 Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:5000`
- Admin user created in backend database

---

## 🔧 Installation

```bash
# Navigate to admin panel directory
cd admin-panel

# Install dependencies
npm install
```

---

## ⚙️ Configuration

### Create `.env.local` file

Create a `.env.local` file in the root of the admin panel directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Application Settings
NODE_ENV=development
```

**That's it!** No database credentials needed.

---

## 🚀 Running the Application

### Development Mode

```bash
# Make sure backend is running first!
# Backend should be running on http://localhost:5000

# Then start admin panel
npm run dev

# Admin panel will run on http://localhost:3001
```

### Production Build

```bash
npm run build
npm run start
```

---

## 🔑 Admin Login

### Default Admin Credentials

The admin user must be created in the **backend database** with role `admin`:

```javascript
// Use backend scripts or MongoDB directly to create admin user
{
  email: "admin@save2740.com",
  password: "Admin@123456",  // Hashed
  role: "admin",  // Important!
  accountStatus: "active"
}
```

### Login Flow

1. Open `http://localhost:3001/login`
2. Enter admin credentials
3. Admin panel sends login request to backend API
4. Backend verifies credentials and returns JWT
5. Admin panel stores JWT and uses it for all subsequent requests

---

## 📁 Project Structure

```
admin-panel/
├── .env.local              # Environment variables (API URL only)
├── package.json            # Dependencies (NO database libraries)
│
├── app/                    # Next.js app directory
│   ├── login/page.tsx     # Login page
│   ├── dashboard/page.tsx # Dashboard
│   ├── users/page.tsx     # User management
│   ├── kyc/page.tsx       # KYC verification
│   ├── wallets/page.tsx   # Wallet management
│   └── ...
│
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── auth/             # Auth components
│
├── lib/                  # Utilities and services
│   ├── api.ts           # HTTP client (fetch wrapper)
│   ├── auth.ts          # Token storage/decode
│   ├── utils.ts         # Utility functions
│   └── services/        # API client services
│       ├── dashboard.service.ts
│       ├── users.service.ts
│       ├── kyc.service.ts
│       └── wallets.service.ts
│
├── contexts/
│   └── AuthContext.tsx  # Client-side auth state
│
└── types/
    └── index.ts         # TypeScript types
```

---

## 🔌 API Integration

### All Data Comes from Backend API

The admin panel consumes these backend endpoints:

```
Authentication:
POST /api/admin/auth/login       - Admin login
GET  /api/admin/auth/me          - Get current admin

Dashboard:
GET  /api/admin/dashboard/stats     - Dashboard statistics
GET  /api/admin/dashboard/activity  - Recent activity
GET  /api/admin/dashboard/alerts    - System alerts

User Management:
GET  /api/admin/users              - List all users
GET  /api/admin/users/:id          - Get user details
POST /api/admin/users/lock         - Lock user account
POST /api/admin/users/unlock       - Unlock user account

KYC Management:
GET  /api/admin/kyc/pending        - Get pending KYC
GET  /api/admin/kyc/:userId        - Get KYC details
POST /api/admin/kyc/approve        - Approve KYC
POST /api/admin/kyc/reject         - Reject KYC

Wallet Management:
GET  /api/admin/wallets            - List all wallets
GET  /api/admin/wallets/:userId    - Get user wallet

Transactions:
GET  /api/admin/transactions       - List transactions
```

### Example: Fetching Users

```typescript
// lib/services/users.service.ts
import { api } from '../api'

export const usersService = {
  getUsers: async (params: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.limit) query.append('limit', params.limit.toString())
    if (params.search) query.append('search', params.search)

    // Calls backend: GET http://localhost:5000/api/admin/users
    return api.get(`/admin/users?${query.toString()}`)
  },

  lockUser: async (id: string) => {
    // Calls backend: PATCH http://localhost:5000/api/admin/users/:id/lock
    return api.patch(`/admin/users/${id}/lock`)
  }
}
```

### Authentication

All requests include the admin JWT:

```typescript
// lib/api.ts
const token = localStorage.getItem('admin_token')

fetch('http://localhost:5000/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 🎨 Features

### Dashboard
- Real-time statistics
- Recent activity feed
- System alerts

### User Management
- View all users
- Search and filter
- Lock/unlock accounts
- View user details

### KYC Verification
- Review pending KYC documents
- Approve/reject with reasons
- View document images
- Track verification history

### Wallet Management
- View wallet balances
- Transaction history
- Audit trail

### Transaction Monitoring
- View all transactions
- Filter by status/type
- Export reports

---

## 🔒 Security

### No Database Credentials
- Admin panel never connects to database
- All data access goes through backend API
- No database credentials stored in admin panel

### JWT Authentication
- Admin JWT issued by backend
- Stored in localStorage
- Sent with every request
- Backend verifies token validity

### Admin Role Checking
- Backend enforces admin role
- Admin panel cannot bypass permissions
- All authorization on backend

---

## 🧪 Development

### Adding New Features

1. **Add backend endpoint first** (in backend repo)
   ```typescript
   // backend/src/routes/admin/feature.routes.ts
   router.get('/feature/data', authenticateAdmin, async (req, res) => {
     // Business logic here
     res.json({ success: true, data: ... })
   })
   ```

2. **Create service in admin panel**
   ```typescript
   // admin-panel/lib/services/feature.service.ts
   import { api } from '../api'
   
   export const featureService = {
     getData: async () => {
       return api.get('/admin/feature/data')
     }
   }
   ```

3. **Create UI component**
   ```typescript
   // admin-panel/app/feature/page.tsx
   import { featureService } from '@/lib/services/feature.service'
   
   export default function FeaturePage() {
     const [data, setData] = useState([])
     
     useEffect(() => {
       featureService.getData().then(setData)
     }, [])
     
     return <div>{/* Render data */}</div>
   }
   ```

---

## 📊 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Native fetch API

**No Database Libraries:**
- ❌ No Mongoose
- ❌ No Prisma
- ❌ No Database drivers

---

## 🚫 What NOT to Do

### DO NOT add database connection
```typescript
// ❌ WRONG - DO NOT DO THIS
import mongoose from 'mongoose'
await mongoose.connect(DATABASE_URL)
```

### DO NOT create Mongoose models
```typescript
// ❌ WRONG - DO NOT DO THIS
const UserSchema = new Schema({ ... })
export default mongoose.model('User', UserSchema)
```

### DO NOT create Next.js API routes
```typescript
// ❌ WRONG - DO NOT DO THIS
// app/api/users/route.ts
export async function GET() {
  const users = await User.find()  // NO!
  return Response.json(users)
}
```

### ALWAYS call backend API
```typescript
// ✅ CORRECT - DO THIS
import { api } from '@/lib/api'
const users = await api.get('/admin/users')
```

---

## 📖 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Detailed architecture explanation
- [Integration Status](./INTEGRATION_STATUS.md) - API integration checklist
- [Admin Panel Status](./ADMIN_PANEL_STATUS.md) - Development status

---

## 🐛 Troubleshooting

### "Network Error" or "Cannot connect"

**Problem:** Admin panel cannot reach backend

**Solution:**
1. Ensure backend is running on port 5000
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Check backend console for errors

### "Unauthorized" or "Invalid token"

**Problem:** JWT token is invalid or expired

**Solution:**
1. Logout and login again
2. Check backend logs for auth errors
3. Verify admin user exists with `role: "admin"`

### "Admin access required"

**Problem:** User account doesn't have admin role

**Solution:**
1. Check backend database
2. Ensure user has `role: "admin"` field
3. Create proper admin user in backend

---

## 🤝 Contributing

When contributing to the admin panel:

1. **Never** add database code
2. **Never** create API routes
3. **Always** call backend endpoints
4. **Always** use the service layer
5. **Always** handle loading/error states
6. Follow the existing patterns

---

## 📝 License

Private - Save 2740 Internal Use Only

---

## 🔗 Related Projects

- **Backend API:** `../backend/` - Express.js API server
- **User Frontend:** `../frontend/` - User-facing Next.js app

All three applications are separate and communicate over HTTP.
