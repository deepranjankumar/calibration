@echo off
title Physical Examination System Launcher
echo =======================================================
echo Starting AI-Driven Physical Examination System...
echo =======================================================

:: Check Backend port 8000
netstat -ano | findstr ":8000 " | findstr "LISTENING" > nul
if %errorlevel% equ 0 (
    echo [1/2] Backend server is already running on port 8000.
) else (
    echo [1/2] Starting Python FastAPI Backend on port 8000...
    start "Physical Exam Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
)

:: Check Frontend port 5173
netstat -ano | findstr ":5173 " | findstr "LISTENING" > nul
if %errorlevel% equ 0 (
    echo [2/2] Frontend server is already running on port 5173.
) else (
    echo [2/2] Starting React + Vite Frontend on port 5173...
    start "Physical Exam Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"
)

echo Waiting for browser launch...
timeout /t 2 /nobreak > nul

start http://localhost:5173

echo.
echo =======================================================
echo System is active and available at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)
echo =======================================================
