@echo off
REM AggieBuddie Backend Startup Script (Windows)
REM This script helps you start the backend server with proper setup

echo ============================================================
echo AggieBuddie Backend - Startup Script
echo ============================================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if Python is installed
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed!
    echo    Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

REM Check Python version
echo Checking Python version...
python --version
echo.

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo ❌ ERROR: requirements.txt not found!
    echo    Make sure you're in the backend directory
    pause
    exit /b 1
)

REM Install dependencies
echo.
echo Upgrading pip to latest version...
python -m pip install --upgrade pip

echo.
echo Installing dependencies...
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ ERROR: Failed to install dependencies
    echo    Try running manually: python -m pip install -r requirements.txt
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Start the Flask server
echo ============================================================
echo Starting Flask Backend Server...
echo ============================================================
echo.
echo ⚠️  Keep this terminal window open!
echo    Closing it will stop the backend server.
echo.

python app.py

pause

