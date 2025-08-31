@echo off
setlocal enabledelayedexpansion

REM LMIA Database Stop Script for Windows
REM This script stops both the backend and frontend servers

echo ==========================================
echo 🛑 LMIA Database Stop Script
echo ==========================================
echo.

REM Stop backend server (port 3001)
echo [INFO] Stopping backend server on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] Backend server stopped
    ) else (
        echo [WARNING] No backend server running on port 3001
    )
)

REM Stop frontend server (port 5173)
echo [INFO] Stopping frontend server on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] Frontend server stopped
    ) else (
        echo [WARNING] No frontend server running on port 5173
    )
)

echo.
echo [SUCCESS] 🎉 All LMIA Database servers stopped!
echo.
pause
