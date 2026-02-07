# Cron Job Tester for Save2740
# This script allows you to manually trigger cron jobs for testing

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Save2740 Cron Job Tester" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Available Cron Jobs:" -ForegroundColor Yellow
Write-Host "1.  Daily Savings Automation" -ForegroundColor Green
Write-Host "2.  Withdrawal Processing" -ForegroundColor Green
Write-Host "3.  Low Balance Alerts" -ForegroundColor Green
Write-Host "4.  Monthly Reports" -ForegroundColor Green
Write-Host "5.  Referral Bonus Processing" -ForegroundColor Green
Write-Host "6.  Weekly Funding Reminders" -ForegroundColor Green
Write-Host "7.  Streak Recovery Reminders" -ForegroundColor Green
Write-Host "8.  Session Cleanup" -ForegroundColor Green
Write-Host "9.  Transaction Sync" -ForegroundColor Green
Write-Host "10. Check Cron Jobs Status" -ForegroundColor Cyan
Write-Host "0.  Exit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Enter your choice (0-10)"

$baseUrl = "http://localhost:5000/api/cron-test"

function Invoke-CronJob {
    param (
        [string]$endpoint,
        [string]$jobName
    )
    
    Write-Host ""
    Write-Host "Triggering: $jobName..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$endpoint" -Method POST -ErrorAction Stop
        
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "Message: $($response.message)" -ForegroundColor Gray
        
        if ($response.result) {
            Write-Host "Result:" -ForegroundColor Yellow
            $response.result | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
        }
    } catch {
        Write-Host "ERROR!" -ForegroundColor Red
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Gray
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Gray
        }
    }
}

switch ($choice) {
    "1" {
        Invoke-CronJob "daily-savings" "Daily Savings Automation"
    }
    "2" {
        Invoke-CronJob "withdrawal-processing" "Withdrawal Processing"
    }
    "3" {
        Invoke-CronJob "low-balance-alerts" "Low Balance Alerts"
    }
    "4" {
        Invoke-CronJob "monthly-reports" "Monthly Reports"
    }
    "5" {
        Invoke-CronJob "referral-bonuses" "Referral Bonus Processing"
    }
    "6" {
        Invoke-CronJob "funding-reminders" "Weekly Funding Reminders"
    }
    "7" {
        Invoke-CronJob "streak-reminders" "Streak Recovery Reminders"
    }
    "8" {
        Invoke-CronJob "cleanup" "Session Cleanup"
    }
    "9" {
        Invoke-CronJob "transaction-sync" "Transaction Sync"
    }
    "10" {
        Write-Host ""
        Write-Host "Checking cron jobs status..." -ForegroundColor Cyan
        
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/status" -Method GET
            
            Write-Host ""
            Write-Host "Cron Jobs Status:" -ForegroundColor Yellow
            Write-Host "=================" -ForegroundColor Yellow
            
            foreach ($job in $response.jobs) {
                $status = if ($job.running) { "RUNNING" } else { "STOPPED" }
                $color = if ($job.running) { "Green" } else { "Red" }
                
                Write-Host "$($job.name): " -NoNewline
                Write-Host $status -ForegroundColor $color
            }
        } catch {
            Write-Host "ERROR!" -ForegroundColor Red
            Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Gray
        }
    }
    "0" {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
