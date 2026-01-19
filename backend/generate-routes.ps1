# Generate all route placeholder files for backend

$routes = @(
    'dashboard',
    'wallet',
    'groups',
    'referrals',
    'save2740',
    'saver-pockets',
    'payments',
    'payment-methods',
    'notifications',
    'fees',
    'kyc',
    'support',
    'support-chat',
    'account',
    'daily-savings',
    'quote-of-day',
    'health',
    'webhooks',
    'banking'
)

$template = @'
import express from 'express';

const router = express.Router();

// TODO: Implement {0} routes
// Migrate logic from app/api/{1}/**

router.get('/', (req, res) => {{
  res.json({{ success: true, message: '{0} API - To be implemented' }});
}});

export default router;
'@

foreach ($route in $routes) {
    $fileName = "$route.routes.ts"
    $filePath = "b:\save 2740 app\backend\src\routes\$fileName"
    
    if (-not (Test-Path $filePath)) {
        $content = $template -f $route, $route
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "Created $fileName"
    }
}

Write-Host "All route files created!"
