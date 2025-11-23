#!/bin/bash
# AggieBuddie Backend Startup Script (Mac/Linux)
# This script helps you start the backend server with proper setup

echo "============================================================"
echo "AggieBuddie Backend - Startup Script"
echo "============================================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Python is installed
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ ERROR: Python is not installed!"
    echo "   Please install Python 3.8+ from python.org"
    exit 1
fi

# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
echo "   Found: $PYTHON_VERSION"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ ERROR: requirements.txt not found!"
    echo "   Make sure you're in the backend directory"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to install dependencies"
    echo "   Try running manually: python -m pip install -r requirements.txt"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Start the Flask server
echo "============================================================"
echo "Starting Flask Backend Server..."
echo "============================================================"
echo ""
echo "⚠️  Keep this terminal window open!"
echo "   Closing it will stop the backend server."
echo ""

$PYTHON_CMD app.py

