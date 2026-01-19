# Backend-Frontend Separation Verification Script

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Save2740 Setup Verification" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Backend directory exists
Write-Host "[1/8] Checking backend directory..." -NoNewline
if (Test-Path "backend") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
    Write-Host "  Backend directory not found!" -ForegroundColor Red
}

# Check 2: Backend package.json exists
Write-Host "[2/8] Checking backend package.json..." -NoNewline
if (Test-Path "backend/package.json") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
}

# Check 3: Backend node_modules exists
Write-Host "[3/8] Checking backend dependencies..." -NoNewline
if (Test-Path "backend/node_modules") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " WARNING" -ForegroundColor Yellow
    Write-Host "  Run: cd backend; npm install" -ForegroundColor Yellow
}

# Check 4: Backend .env exists
Write-Host "[4/8] Checking backend .env..." -NoNewline
if (Test-Path "backend/.env") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " WARNING" -ForegroundColor Yellow
    Write-Host "  Copy .env.example to .env" -ForegroundColor Yellow
}

# Check 5: Frontend .env.local has API_URL
Write-Host "[5/8] Checking frontend API URL..." -NoNewline
if (Test-Path ".env.local") {
    $content = Get-Content ".env.local" -Raw
    if ($content -match "NEXT_PUBLIC_API_URL") {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " WARNING" -ForegroundColor Yellow
        Write-Host "  Add NEXT_PUBLIC_API_URL to .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host " FAIL" -ForegroundColor Red
}

# Check 6: Backend routes exist
Write-Host "[6/8] Checking backend routes..." -NoNewline
$routeCount = (Get-ChildItem "backend/src/routes" -Filter "*.routes.ts" -ErrorAction SilentlyContinue).Count
if ($routeCount -gt 0) {
    Write-Host " OK ($routeCount route files)" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
}

# Check 7: Backend models copied
Write-Host "[7/8] Checking backend models..." -NoNewline
$modelCount = (Get-ChildItem "backend/src/models" -Filter "*.ts" -ErrorAction SilentlyContinue).Count
if ($modelCount -gt 20) {
    Write-Host " OK ($modelCount models)" -ForegroundColor Green
} else {
    Write-Host " WARNING (Only $modelCount models found)" -ForegroundColor Yellow
}

# Check 8: Port availability
Write-Host "[8/8] Checking port availability..." -NoNewline
$port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if (-not $port5000 -and -not $port3000) {
    Write-Host " OK (Ports 3000 and 5000 available)" -ForegroundColor Green
} elseif ($port5000 -and $port3000) {
    Write-Host " INFO (Both servers already running)" -ForegroundColor Cyan
} elseif ($port5000) {
    Write-Host " INFO (Backend running)" -ForegroundColor Cyan
} elseif ($port3000) {
    Write-Host " INFO (Frontend running)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Quick Start Commands" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start Backend:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Start Frontend (in new terminal):" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
