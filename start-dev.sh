#!/bin/bash
# AggieBuddie Development Startup Script (Mac/Linux)
# Starts both backend and frontend

echo "============================================================"
echo "AggieBuddie Development Environment"
echo "============================================================"
echo ""
echo "This will start:"
echo "  1. Backend server (Python Flask)"
echo "  2. Frontend app (Expo/React Native)"
echo ""
read -p "Press Enter to continue..."

# Start backend in background
echo ""
echo "Starting Backend Server..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo ""
echo "Starting Frontend App..."
npm run web

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

