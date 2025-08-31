#!/bin/bash

# LMIA Database Stop Script
# This script stops both the backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        print_status "Stopping processes on port $port..."
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 1
        return 0
    else
        return 1
    fi
}

echo "=========================================="
echo "🛑 LMIA Database Stop Script"
echo "=========================================="
echo ""

# Stop backend server (port 3001)
if kill_port 3001; then
    print_success "Backend server stopped"
else
    print_warning "No backend server running on port 3001"
fi

# Stop frontend server (port 5173)
if kill_port 5173; then
    print_success "Frontend server stopped"
else
    print_warning "No frontend server running on port 5173"
fi

echo ""
print_success "🎉 All LMIA Database servers stopped!"
echo ""
