# Save2740 - Complete Application

Full-stack savings platform with separated frontend and backend.

## Project Structure

```
save-2740-app/
├── frontend/          # Next.js frontend application
│   ├── app/          # Pages and routing
│   ├── components/   # UI components
│   ├── package.json
│   └── README.md
│
├── backend/          # Express.js backend API
│   ├── src/         # Source code
│   ├── package.json
│   └── README.md
│
└── docs/            # Documentation
```

## Quick Start

### Start Backend (Terminal 1)
```bash
cd backend
npm install  # First time only
npm run dev
```
Backend runs on: http://localhost:5000

### Start Frontend (Terminal 2)
```bash
cd frontend
npm install  # First time only
npm run dev
```
Frontend runs on: http://localhost:3000

## Development Workflow

1. **Backend**: Runs on port 5000, handles all API requests
2. **Frontend**: Runs on port 3000, connects to backend via API
3. **Database**: MongoDB (connection string in `backend/.env`)

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL=mongodb+srv://...
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI

### Backend
- Express.js
- TypeScript
- MongoDB (Mongoose)
- JWT Authentication
- Nodemailer

## Deployment

### Backend
Deploy to: AWS EC2, Railway, Heroku, or Render
- Set production environment variables
- Use `npm start` or `npm run build && node dist/server.js`

### Frontend
Deploy to: Vercel (recommended)
- Connect repository
- Set `NEXT_PUBLIC_API_URL` to production backend URL
- Auto-deploys on push

## API Documentation

Backend API endpoints: See `backend/README.md`

Authentication is fully implemented ✅
- POST `/api/auth/signup`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/verify-email`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

Other endpoints are in progress.

## Contributing

1. Backend changes: Work in `backend/` directory
2. Frontend changes: Work in `frontend/` directory
3. Both have separate `package.json` and dependencies

## Status

- ✅ Backend infrastructure complete
- ✅ Authentication working end-to-end
- ⏳ Additional API routes in development
- ✅ Frontend/Backend fully separated

## Documentation

- `IMPLEMENTATION_STATUS.md` - Current progress
- `PROJECT_SEPARATION_SUMMARY.md` - Overview
- `backend/ROUTE_MIGRATION_GUIDE.ts` - Backend development guide
- `frontend/README.md` - Frontend setup
- `backend/README.md` - Backend setup
