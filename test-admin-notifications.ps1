# Create Test Notifications for Admin Panel
# This script creates various test notifications that should appear in the admin panel

$apiUrl = "http://localhost:5000"

Write-Host "=== Creating Test Notifications for Admin Panel ===" -ForegroundColor Cyan

# Step 1: Login as a test user
Write-Host "`n1. Logging in as test user..." -ForegroundColor Yellow
try {
    $userLogin = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method Post -Headers @{ "Content-Type" = "application/json" } -Body (@{
        email = "shahidx345@gmail.com"
        password = "Shahid@123"
    } | ConvertTo-Json)
    
    $userToken = $userLogin.data.accessToken
    $userId = $userLogin.data.user.id
    Write-Host "   ✓ User logged in: $userId" -ForegroundColor Green
} catch {
    Write-Host "   ✗ User login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Send a chat message to create admin notification
Write-Host "`n2. Sending chat message to create admin notification..." -ForegroundColor Yellow
try {
    $chatNotif = Invoke-RestMethod -Uri "$apiUrl/api/chat-notification/user-message" -Method Post -Headers @{
        "Authorization" = "Bearer $userToken"
        "Content-Type" = "application/json"
    } -Body (@{
        message = "Hello admin! This is a test message to create a notification."
        userName = "Test User"
    } | ConvertTo-Json)
    
    Write-Host "   ✓ Chat notification created: $($chatNotif.message)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Chat notification failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Login as admin
Write-Host "`n3. Logging in as admin..." -ForegroundColor Yellow
try {
    $adminLogin = Invoke-RestMethod -Uri "$apiUrl/api/admin/auth/login" -Method Post -Headers @{ "Content-Type" = "application/json" } -Body (@{
        email = "admin@save2740.com"
        password = "Admin@123"
    } | ConvertTo-Json)
    
    $adminToken = $adminLogin.data.accessToken
    Write-Host "   ✓ Admin logged in" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 4: Check notifications
Write-Host "`n4. Checking admin notifications..." -ForegroundColor Yellow
try {
    $notifications = Invoke-RestMethod -Uri "$apiUrl/api/admin/notifications/history?limit=50" -Method Get -Headers @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    
    $count = $notifications.data.notifications.Count
    Write-Host "   ✓ Found $count notifications" -ForegroundColor Green
    
    if ($count -gt 0) {
        Write-Host "`n   Recent notifications:" -ForegroundColor Cyan
        $notifications.data.notifications | Select-Object -First 5 | ForEach-Object {
            Write-Host "   - [$($_.type)] $($_.title)" -ForegroundColor White
            Write-Host "     To: $($_.recipientName) ($($_.recipientEmail))" -ForegroundColor Gray
            Write-Host "     Message: $($_.message)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "   ⚠️  No notifications found in database" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Failed to get notifications: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nNOTE: Refresh the admin panel to see the new notifications!" -ForegroundColor Yellow
