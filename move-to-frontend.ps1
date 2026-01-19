# Script to move frontend files to frontend/ directory

Write-Host "Moving Frontend Files..." -ForegroundColor Cyan

# Define what to move to frontend/
$itemsToMove = @(
    'app',
    'components',
    'context',
    'hooks',
    'public',
    'styles',
    'components.json',
    'next-env.d.ts',
    'next.config.mjs',
    'postcss.config.mjs',
    'tailwind.config.ts',
    'tsconfig.json',
    'package.json',
    'package-lock.json',
    '.env.local',
    '.gitignore',
    'node_modules'
)

# Items to keep in root (backend-related or docs)
# lib/ will need to be split - client code to frontend, server code stays

foreach ($item in $itemsToMove) {
    $sourcePath = ".\$item"
    $destPath = ".\frontend\$item"
    
    if (Test-Path $sourcePath) {
        Write-Host "Moving $item..." -NoNewline
        Move-Item -Path $sourcePath -Destination $destPath -Force -ErrorAction SilentlyContinue
        Write-Host " Done" -ForegroundColor Green
    } else {
        Write-Host "Skipping $item (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Frontend files moved to frontend/ directory" -ForegroundColor Green
