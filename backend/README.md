# Save2740 Backend API

Express.js REST API server for Save2740 application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Copy `.env.example` to `.env` and fill in your values.

3. Start development server:
```bash
npm run dev
```

## Environment Variables

Required variables:
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend application URL for CORS

See `.env.example` for complete list.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/dashboard/overview` - Get overview
...and more

## Development

- `npm run dev` - Run development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production server

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Start server:
```bash
npm start
```

## Tech Stack

- Express.js
- TypeScript
- MongoDB (Mongoose)
- JWT Authentication
- Stripe (Payments)
- Nodemailer (Emails)
