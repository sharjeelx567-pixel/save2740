# 🔔 Complete System Testing Guide

## System Status Summary

### ✅ What's Working:
1. Messages stored in Firebase Firestore
2. Real-time chat with onSnapshot listeners
3. FCM push notifications sent from backend
4. Service workers registered
5. User receives notifications with sound
6. Admin panel live chat functional

### ⚠️ Issues to Fix:
1. Admin notification sound not playing
2. Notifications not appearing in bell dropdown

---

## Step-by-Step Testing

### Test 1: Backend Running
```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Should show: Server running on port 5000
```

### Test 2: Frontend Running
```bash
# Terminal 2: Start frontend
cd frontend
npm run dev
# Should show: Ready on http://localhost:3000
```

### Test 3: Admin Panel Running
```bash
# Terminal 3: Start admin panel
cd admin-panel
npm run dev
# Should show: Ready on http://localhost:3001
```

### Test 4: User Sends Message

**Steps:**
1. Open http://localhost:3000
2. Login as user
3. Check browser console for:
   - ✅ "Service Worker registered"
   - ✅ "FCM token obtained" (or VAPID warning - ok for testing)
4. Click green chat button (bottom right)
5. Send message: "Hello, need help!"

**Expected Backend Logs:**
```
POST /api/chat-notification/user-message
Notification sent to X admins
Creating notification for admin: [adminId]
```

**Expected Results:**
- ✅ Message appears in Firestore
- ✅ Backend receives request
- ✅ Notification created in MongoDB

### Test 5: Admin Receives Notification

**Steps:**
1. Open http://localhost:3001
2. Login as admin
3. Check browser console for:
   - ✅ "[Admin] Service Worker registered"
   - ✅ "[Admin FCM] Token obtained" (or VAPID warning)
   - ✅ "[Admin] Error fetching notifications" or successful fetch

**Check Bell Icon:**
- Look at bell icon in top right header
- Should show red badge with count

**Check Dropdown:**
- Click bell icon
- Should show notification with user's message

**Expected Behavior:**
- 🔔 Browser push notification (if VAPID configured)
- 🔊 Sound plays (Web Audio API)
- 📊 Bell badge shows count
- 💬 Dropdown shows message

---

## Debugging Checklist

### Backend Issues

**Check MongoDB Connection:**
```bash
# In backend console, should see:
✓ MongoDB connected successfully
```

**Check Notification Creation:**
```javascript
// In backend logs after user sends message:
POST /api/chat-notification/user-message
Creating notification for admin: [adminId]
Notification saved: [notificationId]
```

**Test Notifications API:**
```bash
# Get admin token from localStorage (adminToken)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/notifications

# Should return:
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 1
  }
}
```

### Admin Panel Issues

**Check Console Logs:**
```
✅ [Admin] Service Worker registered
✅ [Admin FCM] Token obtained: abc...
✅ Fetching notifications...
❌ [Admin] Error fetching notifications: [error]
```

**Check Network Tab:**
```
GET http://localhost:5000/api/notifications
Status: 200 OK or 401 Unauthorized
```

**Check LocalStorage:**
```javascript
// In browser console:
localStorage.getItem('adminToken')
// Should return a valid JWT token
```

### Frontend (User) Issues

**Check Console Logs:**
```
✅ Service Worker registered
✅ FCM token obtained: xyz...
✅ Chat widget opened
✅ Message sent to Firestore
✅ Notification request sent to backend
```

**Check Firestore:**
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check `supportChats/{userId}/messages` collection
4. Should see your message

---

## Common Fixes

### Fix 1: Notifications Not Showing in Admin Dropdown

**Problem:** Bell icon doesn't show count or dropdown is empty

**Solution:**
```bash
# 1. Check if admin token is valid
# In admin panel browser console:
console.log(localStorage.getItem('adminToken'))

# 2. Test API manually
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/notifications

# 3. Check MongoDB directly
# Connect to MongoDB and query:
db.notifications.find({ userId: "ADMIN_USER_ID" }).pretty()
```

### Fix 2: No Sound on Admin Side

**Problem:** Admin doesn't hear notification sound

**Checks:**
1. Browser console: Look for audio context errors
2. Check browser permissions: Site settings → Sounds allowed
3. Verify FCM service is calling `playNotificationSound()`

**Debug:**
```javascript
// In admin panel Header.tsx console:
// Should see when message arrives:
[Admin] New message event received: {...}
[Admin FCM] Foreground message: {...}
```

### Fix 3: Backend Not Creating Notifications

**Problem:** Notifications API returns empty array

**Check:**
```typescript
// In backend/src/routes/chat-notification.routes.ts
// Add console.log after creating notification:

await Notification.create({
  userId: admin._id,
  type: 'chat_message',
  title: `New message from ${senderName}`,
  message: message.substring(0, 200),
  ...
});
console.log('✅ Notification created for admin:', admin._id);
```

---

## Manual Testing Script

### Create Test Notification (MongoDB)
```javascript
// Run in MongoDB shell or Compass:
db.notifications.insertOne({
  userId: "YOUR_ADMIN_ID",  // Replace with actual admin ID
  type: "chat_message",
  title: "Test Notification",
  message: "This is a test message from manual creation",
  read: false,
  channels: {
    push: true,
    email: false,
    sms: false
  },
  sentAt: new Date(),
  createdAt: new Date()
});
```

Then refresh admin panel and check bell icon.

---

## Expected Console Output

### User Side (Frontend):
```
✅ Service Worker registered: http://localhost:3000/firebase-messaging-sw.js
✅ FCM token obtained: fJ7x...
✅ FCM token registered with backend
Chat widget opened
Message sent successfully
Notification request sent
```

### Admin Side (Admin Panel):
```
✅ [Admin] Service Worker registered: http://localhost:3001/firebase-messaging-sw.js
✅ [Admin FCM] Token obtained: kL2m...
✅ [Admin FCM] Token registered with backend
Fetching notifications...
[Admin] Notifications loaded: 1
[Admin] New message event received: {type: "user_chat", userId: "..."}
🔊 Playing notification sound
```

### Backend:
```
Server running on port 5000
✓ MongoDB connected successfully
POST /api/chat-notification/user-message
Finding admins...
Found 1 admin(s)
Sending FCM to admins...
Creating notification for admin: 507f1f77bcf86cd799439011
✅ Notification created successfully
Notification sent to 1/1 admins
```

---

## Quick Verification

Run these checks in order:

1. ✅ Backend running? → Check http://localhost:5000/api/health
2. ✅ MongoDB connected? → Check backend console for "MongoDB connected"
3. ✅ Admin logged in? → Check localStorage.getItem('adminToken')
4. ✅ User sends message? → Check Firestore for new message
5. ✅ Backend creates notification? → Check backend logs
6. ✅ Admin fetches notifications? → Check Network tab
7. ✅ Notifications in dropdown? → Click bell icon

---

## Status: Action Required

🔴 **CRITICAL**: Need to verify:
1. Backend is creating notifications in MongoDB
2. Admin panel can fetch notifications from API
3. Bell icon updates when new notifications arrive

🟡 **OPTIONAL**: VAPID key for push notifications (works without it for in-app)

---

**Last Updated:** [Current Date]
**System:** All features implemented, testing required
