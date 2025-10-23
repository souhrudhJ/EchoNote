#!/bin/bash

echo "========================================"
echo "Starting EchoNote Development Environment"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create a .env file with your GEMINI_API_KEY"
    echo "You can copy env.example to .env and add your key"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend
echo "Starting Backend Server..."
python server.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting Frontend Development Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "EchoNote is running!"
echo "========================================"
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:8080"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for processes
wait

