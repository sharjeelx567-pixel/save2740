# Test Transaction Creator for Save2740
# This script creates a test deposit transaction for development purposes

Write-Host "Test Transaction Creator" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Get the token from user input (or you can hardcode it)
Write-Host "To get your authentication token:" -ForegroundColor Yellow
Write-Host "1. Open browser console (F12 -> Console tab)" -ForegroundColor Gray
Write-Host "2. Run: localStorage.getItem('token')" -ForegroundColor Gray
Write-Host "3. Copy the token (without quotes)" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Enter your authentication token"
$amount = Read-Host "Enter amount to deposit (default: 50)"

if ([string]::IsNullOrWhiteSpace($amount)) {
    $amount = "50"
}

Write-Host ""
Write-Host "Creating test deposit of `$$amount..." -ForegroundColor Cyan

$body = @{
    amount = [decimal]$amount
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/wallet/test-deposit" `
        -Method POST `
        -Body $body `
        -Headers $headers `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json

    Write-Host ""
    Write-Host "SUCCESS: Transaction created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Transaction Details:" -ForegroundColor Yellow
    Write-Host "   Transaction ID: $($result.transaction.transactionId)" -ForegroundColor Cyan
    Write-Host "   Amount: `$$($result.transaction.amount)" -ForegroundColor Cyan
    Write-Host "   Status: $($result.transaction.status)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Wallet Balance:" -ForegroundColor Yellow
    Write-Host "   Total Balance: `$$($result.wallet.balance)" -ForegroundColor Green
    Write-Host "   Available: `$$($result.wallet.availableBalance)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Refresh your Transactions page to see it!" -ForegroundColor Magenta
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to create transaction" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Gray
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Gray
    }
}
