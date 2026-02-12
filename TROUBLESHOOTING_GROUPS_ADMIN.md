# Troubleshooting: Groups Not Showing in Admin Panel

## ✅ Status: Groups Exist in Database
- **5 groups found** in the database
- Test group created successfully
- Backend API endpoint exists at `/api/admin/groups`

## 🔍 Diagnosis Steps

### Step 1: Check Browser Console
1. Open Admin Panel: `http://localhost:3001/groups`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for errors related to:
   - Authentication failures (401)
   - Network errors
   - CORS errors
   - API call failures

### Step 2: Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for the request to `/api/admin/groups`
4. Click on it to see:
   - **Status Code** (should be 200)
   - **Response** (should have groups data)
   - **Request Headers** (should have Authorization header)

### Step 3: Verify Admin Authentication
1. Open Developer Tools → Console
2. Type: `localStorage.getItem('admin_token')`
3. Press Enter
4. **If null**: You're not logged in
   - Go to `http://localhost:3001/login`
   - Login with admin credentials
5. **If shows a token**: Authentication is working

### Step 4: Test API Manually
Run this in the browser console (while on admin panel):
```javascript
fetch('http://localhost:5000/api/admin/groups', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
  }
})
.then(r => r.json())
.then(data => console.log('Groups:', data))
.catch(err => console.error('Error:', err))
```

## 🐛 Common Issues & Solutions

### Issue 1: "Unauthorized" (401 Error)
**Symptom**: Console shows 401 status code  
**Cause**: Not logged in or token expired  
**Solution**:
1. Logout and login again
2. Check if `/api/admin/auth/login` endpoint works
3. Verify admin credentials

### Issue 2: "No groups found" but groups exist in DB
**Symptom**: API returns empty array but DB has groups  
**Cause**: Query filter is too restrictive  
**Solution**:
1. Remove all filters (set Status to "All Status")
2. Clear search box
3. Refresh page

### Issue 3: CORS Error
**Symptom**: Console shows "CORS policy" error  
**Cause**: Backend not allowing admin panel origin  
**Solution**:
1. Check `backend/.env` → `CORS_ORIGIN` includes admin panel URL
2. Should include: `http://localhost:3001`
3. Restart backend server

### Issue 4: Network Request Fails
**Symptom**: Request doesn't reach server  
**Cause**: Backend not running or wrong API URL  
**Solution**:
1. Verify backend is running on port 5000
2. Check `admin-panel/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:5000`
3. Restart admin panel

### Issue 5: API Response is Empty
**Symptom**: Status 200 but no data  
**Cause**: Response structure mismatch  
**Solution**:
Check if response has this structure:
```json
{
  "success": true,
  "data": {
    "groups": [...],
    "pagination": {...}
  }
}
```

## 🔧 Quick Fixes

### Fix 1: Hard Refresh
1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. This clears cache and reloads

### Fix 2: Clear Admin Token
```javascript
// Run in browser console
localStorage.removeItem('admin_token')
// Then login again
```

### Fix 3: Restart All Services
```bash
# Stop all (Ctrl+C in each terminal)
# Then restart:

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Admin Panel  
cd admin-panel
npm run dev
```

### Fix 4: Check Backend Logs
Look for the actual API call in backend terminal:
```
GET /api/admin/groups
```
If you don't see it, the request isn't reaching the backend.

## 📋 Checklist

Use this to systematically debug:

- [ ] Backend server running on port 5000
- [ ] Admin panel running on port 3001
- [ ] Logged into admin panel
- [ ] Admin token exists in localStorage
- [ ] No 401 errors in console
- [ ] No CORS errors in console
- [ ] Network request shows in Network tab
- [ ] Request includes Authorization header
- [ ] Response status is 200
- [ ] Response data is

 not empty
- [ ] Groups array exists in response
- [ ] All filters set to "All"
- [ ] Search box is empty

## 🎯 Expected Behavior

When working correctly:
1. Navigate to `/groups`
2. See "Total Groups: 5" in the stats card
3. See table with 5 groups listed
4. Can filter by status
5. Can search by name/code

## 📞 If Still Not Working

Run this diagnostic script:
```bash
cd backend
npx ts-node scripts/test-groups-endpoint.ts
```

This will show:
- ✅ How many groups are in DB
- ✅ Sample group details
- ✅ If API is accessible

---

**Created**: 2026-02-10
**Last Updated**: 2026-02-10
**Related**: TEST_DATA_CREATED.md, TESTING_GUIDE_OSUSU_AND_SAVINGS.md
