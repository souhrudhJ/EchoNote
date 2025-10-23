@echo off
echo ========================================
echo Starting EchoNote Development Environment
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create a .env file with your GEMINI_API_KEY
    echo You can copy env.example to .env and add your key
    pause
    exit /b 1
)

echo Starting Backend Server...
start "EchoNote Backend" cmd /k "python server.py"

timeout /t 3

echo Starting Frontend Development Server...
cd frontend
start "EchoNote Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo EchoNote is starting up!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8080
echo ========================================
echo.
echo Press any key to stop all servers...
pause > nul

taskkill /FI "WindowTitle eq EchoNote Backend*" /T /F
taskkill /FI "WindowTitle eq EchoNote Frontend*" /T /F

