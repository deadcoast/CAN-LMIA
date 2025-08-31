# 🚀 LMIA Database Startup Guide

This guide explains how to easily start both the backend and frontend servers for the LMIA Database application.

## Quick Start

### Option 1: Automated Scripts (Recommended)

#### For macOS/Linux:
```bash
./start.sh
```

#### For Windows:
```cmd
start.bat
```

#### Using npm scripts:
```bash
# macOS/Linux
npm run start:all

# Windows
npm run start:all:win
```

### Option 2: Manual Startup

If you prefer to start the servers manually:

#### Terminal 1 - Backend Server:
```bash
node server.js
```

#### Terminal 2 - Frontend Server:
```bash
npm run dev
```

## What the Scripts Do

The automated startup scripts will:

1. ✅ **Check Dependencies**: Verify Node.js and npm are installed
2. ✅ **Install Packages**: Run `npm install` if needed
3. ✅ **Kill Existing Processes**: Clean up any existing servers on ports 3001 and 5173
4. ✅ **Start Backend**: Launch the Node.js server on port 3001
5. ✅ **Start Frontend**: Launch the Vite development server on port 5173
6. ✅ **Health Checks**: Wait for both servers to be ready
7. ✅ **Open Browser**: Automatically open the application
8. ✅ **Monitor**: Keep both servers running and monitor their status
9. ✅ **Cleanup**: Properly shut down both servers when you press Ctrl+C

## Access Points

Once both servers are running:

- **🌐 Frontend Application**: http://localhost:5173
- **📊 Backend API**: http://localhost:3001
- **🔍 API Health Check**: http://localhost:3001/api/health

## Logs

The scripts create log files for debugging:

- **Backend Logs**: `server.log`
- **Frontend Logs**: `frontend.log`

To view logs in real-time:
```bash
# Backend logs
tail -f server.log

# Frontend logs  
tail -f frontend.log
```

## Stopping the Servers

### With Automated Scripts:
- Press **Ctrl+C** in the terminal running the script
- The script will automatically clean up both servers

### Manual Cleanup:
```bash
# Kill processes on specific ports
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

## Troubleshooting

### Port Already in Use
The scripts automatically detect and kill existing processes on ports 3001 and 5173. If you still get port conflicts:

```bash
# Check what's using the ports
lsof -i :3001
lsof -i :5173

# Kill specific processes
kill -9 <PID>
```

### Dependencies Issues
If you get dependency errors:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Server Won't Start
Check the log files for detailed error messages:
- `server.log` for backend issues
- `frontend.log` for frontend issues

## Features

- 🎯 **One-Command Startup**: Start everything with a single command
- 🔄 **Auto-Recovery**: Automatically handles port conflicts and cleanup
- 📊 **Health Monitoring**: Waits for servers to be ready before proceeding
- 🌐 **Auto-Open Browser**: Opens the application automatically
- 📝 **Comprehensive Logging**: Detailed logs for debugging
- 🛑 **Clean Shutdown**: Properly stops all processes on exit
- 🖥️ **Cross-Platform**: Works on macOS, Linux, and Windows

## Development Workflow

1. Run the startup script: `./start.sh` (or `start.bat` on Windows)
2. The application opens automatically in your browser
3. Make changes to your code - hot reload is enabled
4. Press Ctrl+C when done to stop both servers

That's it! No more manually starting multiple terminals. 🎉
