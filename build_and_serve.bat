@echo off
echo ========================================
echo Building and Starting EchoNote Production
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create a .env file with your GEMINI_API_KEY
    pause
    exit /b 1
)

echo Building Frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo Frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Starting Production Server...
python server.py

pause

