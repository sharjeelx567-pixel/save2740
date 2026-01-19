# Image Troubleshooting Guide

## Issue: Public Folder Images Not Working

After moving to monorepo structure, images may not load. Here's how to fix it:

## ✅ Verification Checklist

### 1. Check Public Folder Location
```bash
# Should exist at:
frontend/public/
```

### 2. Check Image References
Images should be referenced with `/` prefix (no "public"):
```tsx
// ✅ Correct
<img src="/logo.png" />
<Image src="/dashboard-icon.png" />

// ❌ Wrong
<img src="public/logo.png" />
<img src="/public/logo.png" />
```

### 3. Clear Next.js Cache
```bash
cd frontend
rm -rf .next
npm run dev
```

### 4. Restart Development Server
Stop and restart `npm run dev` in the frontend directory.

## Common Issues & Solutions

### Issue 1: Images Show 404
**Solution:** Clear .next cache and restart server
```bash
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

### Issue 2: Only Some Images Don't Work
**Problem:** Missing files or typos in filenames
**Solution:** Check exact filename in `frontend/public/`
```bash
# List all public files
ls frontend/public
```

### Issue 3: Images Work Locally But Not After Move
**Solution:** Next.js needs to rebuild
```bash
cd frontend
npm run dev
# Wait for compilation to complete
```

### Issue 4: Using Next.js Image Component
Make sure you're using it correctly:
```tsx
import Image from 'next/image';

// For static images in public/
<Image 
  src="/logo.png" 
  alt="Logo" 
  width={100} 
  height={100} 
/>
```

## Quick Fix Script

Run this from project root:
```powershell
# Clear cache and restart
cd frontend
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

## Verify Images Are Loading

1. Start frontend: `cd frontend && npm run dev`
2. Open browser: http://localhost:3000
3. Open DevTools (F12) → Network tab
4. Look for image requests
5. Check if they return 200 or 404

### Expected Image Paths:
- http://localhost:3000/logo.png ✅
- http://localhost:3000/dashboard-icon.png ✅
- http://localhost:3000/placeholder-user.jpg ✅

## Available Images

Located in `frontend/public/`:
- achievements-icon.png
- apple-icon.png
- dashboard-icon.png
- kyc-button.png
- login-logo.png
- logo.png
- placeholder-logo.png
- placeholder-user.jpg
- referrals-icon.png
- save2740-logo.png
- saver-pockets-icon.png
- subscription-icon.png
- transaction-icon.png
- wallet-icon.png
- And more...

## Still Not Working?

Check that:
1. Frontend is running from the `frontend/` directory
2. The `public/` folder exists in `frontend/public/`
3. Next.js dev server has fully started
4. No errors in terminal
5. Browser cache is cleared (Ctrl+Shift+R)

## Test Image Loading

Create a test page to verify:

`frontend/app/test-images/page.tsx`:
```tsx
export default function TestImages() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Image Test</h1>
      <div className="grid grid-cols-3 gap-4">
        <img src="/logo.png" alt="Logo" className="w-32" />
        <img src="/dashboard-icon.png" alt="Dashboard" className="w-32" />
        <img src="/wallet-icon.png" alt="Wallet" className="w-32" />
      </div>
    </div>
  );
}
```

Visit: http://localhost:3000/test-images

If images show here, the issue is with specific components. If not, there's a configuration issue.
