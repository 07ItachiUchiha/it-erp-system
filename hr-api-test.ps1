#!/usr/bin/env pwsh

Write-Host "=== HR Module API Testing ===" -ForegroundColor Green
Write-Host ""

# Get authentication token
Write-Host "1. Getting authentication token..." -ForegroundColor Yellow
try {
    $body = @{ email = "admin@admin.com"; password = "admin123" } | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $loginResponse.access_token
    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "   SUCCESS: Token obtained" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to login - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test employees search endpoint (used by HR module)
Write-Host "2. Testing employees search endpoint..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/employees/search" -Method Get -Headers $headers -ContentType "application/json"
    Write-Host "   SUCCESS: Found $($searchResponse.data.Count) employees" -ForegroundColor Green
    Write-Host "   Employee example: $($searchResponse.data[0].firstName) $($searchResponse.data[0].lastName)" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR: Failed to fetch employees - $($_.Exception.Message)" -ForegroundColor Red
}

# Test employees search with status filter (used by HR getActiveEmployees)
Write-Host "3. Testing active employees endpoint..." -ForegroundColor Yellow
try {
    $activeResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/employees/search?status=active&limit=1000" -Method Get -Headers $headers -ContentType "application/json"
    Write-Host "   SUCCESS: Found $($activeResponse.data.Count) active employees" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to fetch active employees - $($_.Exception.Message)" -ForegroundColor Red
}

# Test HR leave requests endpoint
Write-Host "4. Testing HR leave requests endpoint..." -ForegroundColor Yellow
try {
    $leaveResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/hr/leave-requests" -Method Get -Headers $headers -ContentType "application/json"
    Write-Host "   SUCCESS: HR leave requests endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to access HR leave requests - $($_.Exception.Message)" -ForegroundColor Red
}

# Test HR payroll endpoint  
Write-Host "5. Testing HR payroll endpoint..." -ForegroundColor Yellow
try {
    $payrollResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/hr/payroll" -Method Get -Headers $headers -ContentType "application/json"
    Write-Host "   SUCCESS: HR payroll endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to access HR payroll - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== API TESTING COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed, the backend APIs are working correctly." -ForegroundColor Green
Write-Host "If employees are still not showing in frontend, the issue is in:" -ForegroundColor Yellow
Write-Host "  1. Frontend authentication token storage" -ForegroundColor White
Write-Host "  2. API client request headers" -ForegroundColor White  
Write-Host "  3. Component state management" -ForegroundColor White
Write-Host "  4. Browser console errors" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Magenta
Write-Host "  1. Open browser dev tools (F12)" -ForegroundColor White
Write-Host "  2. Go to http://localhost:3000/hr" -ForegroundColor White
Write-Host "  3. Login with admin@admin.com / admin123" -ForegroundColor White
Write-Host "  4. Check Console tab for errors" -ForegroundColor White
Write-Host "  5. Check Network tab for failed API calls" -ForegroundColor White
