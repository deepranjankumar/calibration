# One-click PowerShell Launcher
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Starting AI-Driven Physical Examination System..." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npx vite"

Start-Sleep -Seconds 3

# Open Browser
Start-Process "http://localhost:5173"

Write-Host "`nSystem is running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
