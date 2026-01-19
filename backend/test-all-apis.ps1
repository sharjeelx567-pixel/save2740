# API Testing Automated Script
$BaseUrl = "http://localhost:5000/api"
$RandomInt = Get-Random -Minimum 1000 -Maximum 9999
$Email = "testuser$RandomInt@example.com"
$Password = "TestPass123!"

Write-Host "🚀 STARTING API HEALTH CHECK..." -ForegroundColor Cyan
Write-Host "Target: $BaseUrl" -ForegroundColor Gray
Write-Host "Test User: $Email" -ForegroundColor Gray

# 1. Health Check
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "✅ Health Check: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    exit
}

# 2. Signup
Write-Host "`n👤 Testing Authentication..." -ForegroundColor Yellow
$signupBody = @{
    email = $Email
    password = $Password
    firstName = "TestUser"
    selectedChallenge = "daily"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
    Write-Host "✅ Signup: OK" -ForegroundColor Green
} catch {
    $err = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($err)
    Write-Host "❌ Signup: FAILED - $($reader.ReadToEnd())" -ForegroundColor Red
    exit
}

# 3. Login & Get Token
$loginBody = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $Token = $loginResponse.data.token
    Write-Host "✅ Login: OK (Token received)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login: FAILED" -ForegroundColor Red
    exit
}

# Headers for authenticated requests
$Headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

# Function to test an endpoint
function Test-Endpoint {
    param($Name, $Uri, $Method="Get", $Body=$null)
    try {
        if ($Body) {
             Invoke-RestMethod -Uri "$BaseUrl$Uri" -Method $Method -Headers $Headers -Body $Body -ContentType "application/json" | Out-Null
        } else {
             Invoke-RestMethod -Uri "$BaseUrl$Uri" -Method $Method -Headers $Headers | Out-Null
        }
        Write-Host "✅ $Name : OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $Name : FAILED ($($_.Exception.Message))" -ForegroundColor Red
    }
}

# 4. Core Features
Write-Host "`n📊 Testing Core Features..." -ForegroundColor Yellow
Test-Endpoint -Name "Get Profile" -Uri "/profile"
Test-Endpoint -Name "Dashboard Overview" -Uri "/dashboard/overview"
Test-Endpoint -Name "Dashboard Stats" -Uri "/dashboard/stats"
Test-Endpoint -Name "Wallet Status" -Uri "/wallet"
Test-Endpoint -Name "Referral Stats" -Uri "/referrals/stats"

# 5. Groups
Write-Host "`n👥 Testing Groups..." -ForegroundColor Yellow
Test-Endpoint -Name "List Groups" -Uri "/groups"

$groupBody = @{
    name = "Test Group $RandomInt"
    contributionAmount = 50
} | ConvertTo-Json
try {
    $gResponse = Invoke-RestMethod -Uri "$BaseUrl/groups" -Method Post -Headers $Headers -Body $groupBody -ContentType "application/json"
    Write-Host "✅ Create Group: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Create Group: FAILED" -ForegroundColor Red
}

# 6. Saver Pockets
Write-Host "`n💰 Testing Saver Pockets..." -ForegroundColor Yellow
Test-Endpoint -Name "List Pockets" -Uri "/saver-pockets"

# 7. Placeholder APIs
Write-Host "`n🔌 Testing Supporting APIs (Placeholders)..." -ForegroundColor Yellow
Test-Endpoint -Name "Notifications" -Uri "/notifications"
Test-Endpoint -Name "Quote of Day" -Uri "/quote-of-day"
Test-Endpoint -Name "KYC Status" -Uri "/kyc/status"
Test-Endpoint -Name "Support Chat" -Uri "/support-chat/history"
Test-Endpoint -Name "Fees" -Uri "/fees"

Write-Host "`n✨ DONE! If all are green, your backend is 100% healthy." -ForegroundColor Cyan
