@echo off
REM AggieBuddie Development Startup Script (Windows)
REM Starts both backend and frontend in separate windows

echo ============================================================
echo AggieBuddie Development Environment
echo ============================================================
echo.
echo This will start:
echo   1. Backend server (Python Flask)
echo   2. Frontend app (Expo/React Native)
echo.
echo Press any key to continue...
pause >nul

echo.
echo Starting Backend Server...
start "AggieBuddie Backend" cmd /k "cd /d %~dp0backend && python app.py"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend App...
cd /d %~dp0
start "AggieBuddie Frontend" cmd /k "npm run web"

echo.
echo ============================================================
echo Both servers are starting in separate windows.
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8081
echo.
echo Keep both windows open!
echo ============================================================
pause

