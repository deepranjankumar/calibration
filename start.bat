@echo off
title AI-Driven Physical Examination System Launcher
echo =======================================================
echo Starting AI-Driven Physical Examination System...
echo =======================================================

echo.
echo [1/2] Starting Python FastAPI Backend on http://localhost:8000...
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [2/2] Starting React + Three.js Frontend on http://localhost:5173...
start "Frontend - Vite React" cmd /k "cd /d %~dp0frontend && npx vite"

echo.
echo Waiting for servers to initialize...
timeout /t 3 >nul

echo Opening web application in your default browser...
start http://localhost:5173

echo.
echo =======================================================
echo System is running!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000 (API Docs: /docs)
echo =======================================================
pause
