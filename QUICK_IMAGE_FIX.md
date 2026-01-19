# Quick Fix for Images

## The Problem
After moving to `frontend/` folder, images aren't loading.

## The Solution

### Step 1: Stop the Frontend Server
Press `Ctrl+C` in the terminal running `npm run dev`

### Step 2: Clear the Cache
```bash
cd frontend
Remove-Item -Recurse -Force .next
```

### Step 3: Restart the Server
```bash
npm run dev
```

### Step 4: Hard Refresh Browser
- Press `Ctrl+Shift+R` (Windows/Linux)
- Or `Cmd+Shift+R` (Mac)

## Why This Happens

When we moved files to the `frontend/` folder, Next.js's build cache (`.next/`) still had references to the old structure. Clearing it forces Next.js to rebuild with the correct paths.

## Verify It's Working

1. Open http://localhost:3000
2. Press F12 to open DevTools
3. Go to Network tab
4. Look for image requests (logo.png, etc.)
5. They should show status 200 ✅

If you see 404 errors, the images are still missing from the cache.

## Still Not Working?

Make sure:
1. You're in the `frontend/` directory when running `npm run dev`
2. The `public/` folder exists at `frontend/public/`
3. Images are referenced with `/` prefix (e.g., `/logo.png`)
4. Next.js dev server has fully compiled (wait for "Ready" message)

---

**TL;DR:**
```bash
cd frontend
rm -rf .next  # or Remove-Item -Recurse -Force .next
npm run dev
```

Then refresh your browser with `Ctrl+Shift+R`
