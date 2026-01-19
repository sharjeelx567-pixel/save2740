# Backend API Testing Guide

## Quick Health Check

Once the backend is running (`npm run dev` in the backend directory), test these endpoints:

### 1. Health Check
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-18T..."
}
```

### 2. Test Signup (Create Account)
```bash
# PowerShell
$body = @{
    email = "test@example.com"
    password = "Test1234"
    firstName = "Test"
    selectedChallenge = "daily"
    multiplier = 1
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/signup" -Method POST -Body $body -ContentType "application/json"
```

### 3. Test Login
```bash
# PowerShell
$body = @{
    email = "test@example.com"
    password = "Test1234"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### 4. Testing with Postman/Insomnia

**Better option**: Use Postman or Insomnia for easier testing.

#### Signup Request
- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/signup`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "email": "yourname@example.com",
  "password": "YourPassword123",
  "firstName": "Your Name",
  "selectedChallenge": "daily",
  "multiplier": 1
}
```

#### Login Request
- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "email": "yourname@example.com",
  "password": "YourPassword123"
}
```

Response should include a `token` - save this for authenticated requests.

#### Get Current User (Protected Route)
- **Method**: GET
- **URL**: `http://localhost:5000/api/auth/me`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE`

## Server Status

The backend should show:
```
✅ MongoDB connected successfully
🚀 Server is running on port 5000
📍 Environment: development
🌐 Frontend URL: http://localhost:3000
```

## Common Issues

### Issue: "EADDRINUSE: address already in use"
**Solution**: Port 5000 is already in use
```bash
# Find and kill process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Issue: "MongooseServerSelectionError"
**Solution**: Check MongoDB connection string in `backend/.env`
- Ensure `DATABASE_URL` is correct
- Check MongoDB Atlas network access
- Verify credentials

### Issue: "Cannot find module"
**Solution**: Install dependencies
```bash
cd backend
npm install
```

### Issue: TypeScript compilation errors
**Solution**: The file should now be fixed. If you still see errors, check:
- All imports match the actual model exports
- TypeScript is installed (`npm install` should have done this)
- Run `npm run build` to see detailed errors

## Next Step

Once the backend is running successfully, you can:
1. Test the authentication endpoints listed above
2. Start the frontend (`npm run dev` in the root directory)
3. Try to signup/login through the UI at `http://localhost:3000`
4. Check the browser Network tab to verify API calls go to `localhost:5000`

The UI should work identically to before, except now it's calling the separate backend API!
