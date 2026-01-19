# Update imports in frontend files
Write-Host "Updating frontend imports..."

$frontendFiles = Get-ChildItem -Path "frontend" -Include "*.ts","*.tsx" -Recurse

foreach ($file in $frontendFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Update imports
    $content = $content -replace "from ['""]@/components", "from '@frontend/components"
    $content = $content -replace "from ['""]@/hooks", "from '@frontend/hooks"
    $content = $content -replace "from ['""]@/context", "from '@frontend/context"
    $content = $content -replace "from ['""]@/lib/utils", "from '@frontend/lib/utils"
    $content = $content -replace "from ['""]@/types", "from '@frontend/types"
    $content = $content -replace "from ['""]@/app", "from '@frontend/app"
    $content = $content -replace "from ['""]@/styles", "from '@frontend/styles"
    $content = $content -replace "from ['""]@/public", "from '@frontend/public"
    
    # If content changed, write it back
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nUpdating backend imports..."

# Update imports in backend files
$backendFiles = Get-ChildItem -Path "backend" -Include "*.ts","*.tsx","*.js" -Recurse

foreach ($file in $backendFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Update imports
    $content = $content -replace "from ['""]@/lib", "from '@backend/lib"
    $content = $content -replace "from ['""]@/api", "from '@backend/api"
    $content = $content -replace "from ['""]@/middleware", "from '@backend/middleware"
    $content = $content -replace "from ['""]@/scripts", "from '@backend/scripts"
    
    # Fix double replacements
    $content = $content -replace "from '@backend/@backend/lib", "from '@backend/lib"
    
    # If content changed, write it back
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nImport update complete!"
