# Test Admin Chat Profile Endpoint
$apiUrl = "http://localhost:5000"

# Get admin token (use your actual admin credentials)
Write-Host "=== Testing Admin Chat Profile Endpoint ===" -ForegroundColor Cyan

# Login as admin
Write-Host "`n1. Logging in as admin..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$apiUrl/api/admin/auth/login" -Method Post -Headers @{ "Content-Type" = "application/json" } -Body (@{
    email = "admin@save2740.com"
    password = "Admin@123"
} | ConvertTo-Json)

if ($loginResponse.success) {
    $token = $loginResponse.data.accessToken
    Write-Host "   ✓ Admin logged in successfully" -ForegroundColor Green
    
    # Test getting user profile - use a real user ID from your database
    Write-Host "`n2. Testing GET /api/admin/chat/{userId}/profile..." -ForegroundColor Yellow
    
    # You'll need to replace this with an actual user ID
    $testUserId = "69770c3efef3bb2efea1954d" # Replace with actual user ID from your DB
    
    try {
        $profileResponse = Invoke-RestMethod -Uri "$apiUrl/api/admin/chat/$testUserId/profile" -Method Get -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        Write-Host "   ✓ Profile endpoint working!" -ForegroundColor Green
        Write-Host "   User: $($profileResponse.data.user.firstName) $($profileResponse.data.user.lastName)" -ForegroundColor Cyan
        Write-Host "   Email: $($profileResponse.data.user.email)" -ForegroundColor Cyan
    } catch {
        Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ Admin login failed" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
