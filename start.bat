@echo off
setlocal enabledelayedexpansion

REM LMIA Database Startup Script for Windows
REM This script starts both the backend server and frontend development server

echo ==========================================
echo 🚀 LMIA Database Startup Script
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "server.js" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo [INFO] Checking dependencies...

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
) else (
    echo [SUCCESS] Dependencies already installed
)

REM Kill existing processes on our ports
echo [INFO] Checking for existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Start backend server
echo [INFO] Starting backend server on port 3001...
start /b node server.js > server.log 2>&1

REM Wait for backend to be ready
echo [INFO] Waiting for backend server to be ready...
timeout /t 3 /nobreak >nul

REM Test backend health
:test_backend
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend not ready yet, waiting...
    timeout /t 2 /nobreak >nul
    goto test_backend
)

echo [SUCCESS] Backend server started successfully

REM Start frontend server
echo [INFO] Starting frontend development server on port 5173...
start /b npm run dev > frontend.log 2>&1

REM Wait for frontend to be ready
echo [INFO] Waiting for frontend server to be ready...
timeout /t 5 /nobreak >nul

REM Test frontend
:test_frontend
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend not ready yet, waiting...
    timeout /t 2 /nobreak >nul
    goto test_frontend
)

echo [SUCCESS] Frontend server started successfully

echo.
echo ==========================================
echo [SUCCESS] 🎉 Both servers are running!
echo ==========================================
echo.
echo 📊 Backend API:  http://localhost:3001
echo 🌐 Frontend App: http://localhost:5173
echo.
echo 📝 Logs:
echo    Backend:  type server.log
echo    Frontend: type frontend.log
echo.
echo 🛑 Press any key to stop both servers
echo.

REM Open the application in the default browser
echo [INFO] Opening application in browser...
start http://localhost:5173

REM Wait for user input to stop
pause >nul

REM Cleanup - kill the processes
echo [INFO] Shutting down servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [SUCCESS] Cleanup complete
pause
