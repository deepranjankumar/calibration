@echo off
title Physical Examination System Launcher
echo =======================================================
echo Starting AI-Driven Physical Examination System...
echo =======================================================

echo [1/2] Starting Python FastAPI Backend on port 8000...
start "Physical Exam Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React + Vite Frontend on port 5173...
start "Physical Exam Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo Waiting for servers to initialize...
timeout /t 5 /nobreak > nul

start http://localhost:5173

echo.
echo System started successfully!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo =======================================================
