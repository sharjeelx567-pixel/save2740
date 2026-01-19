# Fix remaining imports in specific files
$files = @(
    "frontend\components\stat-cards.tsx",
    "frontend\components\savings-breakdown.tsx",
    "frontend\components\hero-card.tsx",
    "frontend\components\save2740\plan-completed-celebration.tsx",
    "frontend\components\save2740\active-plan-screen.tsx",
    "frontend\components\payments\payment-receipt.tsx",
    "frontend\components\payments\payment-dispute-screen.tsx",
    "frontend\components\payments\payment-authorization-screen.tsx",
    "frontend\components\payments\manage-payment-methods.tsx",
    "frontend\components\payments\chargeback-notice.tsx",
    "frontend\components\payments\auto-debit-setup.tsx",
    "frontend\components\payments\auto-debit-confirmation.tsx",
    "frontend\components\payments\add-debit-card.tsx",
    "frontend\components\payments\add-bank-account.tsx",
    "frontend\components\dashboard\dashboard-container.tsx",
    "frontend\app\save2740\page.tsx",
    "frontend\app\join\[code]\page.tsx"
)

foreach ($filePath in $files) {
    if (Test-Path $filePath) {
        $content = Get-Content $filePath | Out-String
        $originalContent = $content
        
        # Update imports - backend paths
        $content = $content -replace "from ['""]@/lib/types", "from '@backend/lib/types"
        $content = $content -replace "from ['""]@/lib/", "from '@backend/lib/"
        
        if ($content -ne $originalContent) {
            $content | Set-Content -Path $filePath -NoNewline
            Write-Host "Updated: $filePath"
        }
    }
}

Write-Host "Remaining imports fixed!"
