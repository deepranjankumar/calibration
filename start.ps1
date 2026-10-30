# One-click PowerShell Launcher
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Starting AI-Driven Physical Examination System..." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Check & Start Backend (port 8000)
$port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $port8000) {
    Write-Host "[1/2] Starting Python FastAPI Backend on port 8000..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
} else {
    Write-Host "[1/2] Backend server is already running on port 8000." -ForegroundColor Green
}

# 2. Check & Start Frontend (port 5173)
$port5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $port5173) {
    Write-Host "[2/2] Starting React + Vite Frontend on port 5173..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"
} else {
    Write-Host "[2/2] Frontend server is already running on port 5173." -ForegroundColor Green
}

# 3. Wait until both ports are listening before opening browser
Write-Host "Waiting for servers to become ready..." -ForegroundColor Cyan
for ($i = 0; $i -lt 15; $i++) {
    $f = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    $b = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($f -and $b) {
        break
    }
    Start-Sleep -Seconds 1
}

Start-Sleep -Milliseconds 800

# 4. Open Default Browser
Start-Process "http://localhost:5173"

Write-Host "`nSystem is ready and running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)" -ForegroundColor Yellow
