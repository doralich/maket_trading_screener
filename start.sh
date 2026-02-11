#!/bin/bash

# --- TradingView Screener Automated Setup & Startup ---

echo "=========================================="
echo "   MARKET TRADING SCREENER INITIALIZER    "
echo "=========================================="

# 1. Kill any existing processes on ports 8000 and 5173
echo "> Cleaning up existing processes..."
lsof -ti :8000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# 2. Check for Python Virtual Environment
if [ ! -d "venv" ]; then
    echo "> Creating Python Virtual Environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r backend/requirements.txt
fi

# 3. Check for Frontend Dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "> Installing Frontend Dependencies (this may take a minute)..."
    cd frontend && npm install && cd ..
fi

# 4. Start the Backend
echo "> Starting Python Backend (Port 8000)..."
cd backend
../venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 5. Start the Frontend
echo "> Starting React Frontend (Port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Handle Shutdown (Ctrl+C)
trap "echo ''; echo '> Shutting down...'; kill $BACKEND_PID; kill $FRONTEND_PID; exit" SIGINT SIGTERM

echo ""
echo "=========================================="
echo " SYSTEM ONLINE: http://localhost:5173"
echo "=========================================="
echo "Press Ctrl+C to stop all services."
echo ""

# Keep script running to maintain the trap
wait