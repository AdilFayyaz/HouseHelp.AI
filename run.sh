#!/bin/bash

# HouseHelp.AI - Complete Setup and Run Script

echo "🏠🤖 HouseHelp.AI - AI-Powered Home Repair Assistant"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found. Please run the setup first."
    print_status "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Setup backend
print_header "Setting up Backend..."
cd backend

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
else
    print_error "requirements.txt not found in backend directory"
    exit 1
fi

# Create uploads directory
mkdir -p uploads

# Initialize database
print_status "Initializing database..."
python -c "
from app.database import create_tables, initialize_sample_data
create_tables()
initialize_sample_data()
print('Database initialized successfully!')
" 2>/dev/null || print_warning "Database may already be initialized"

cd ..

# Setup frontend
print_header "Setting up Frontend..."
cd frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and npm first."
    print_status "Visit: https://nodejs.org/"
    exit 1
fi

# Install Node.js dependencies
if [ -f "package.json" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
else
    print_error "package.json not found in frontend directory"
    exit 1
fi

cd ..

print_status "Setup complete! 🎉"
echo ""
print_header "Starting HouseHelp.AI..."

# Function to start backend
start_backend() {
    # Check if Ollama is running
    print_status "Checking Ollama..."
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_warning "Ollama is not running. Starting Ollama in background..."
        ollama serve &
        OLLAMA_PID=$!
        sleep 3
        print_status "Ollama started (PID: $OLLAMA_PID)"
    else
        print_status "Ollama is already running"
    fi
    
    # Check if phi4-mini model is available
    if ! ollama list | grep -q "phi4-mini"; then
        print_warning "phi4-mini model not found. This may cause AI features to fall back to basic responses."
        print_status "To install: ollama pull phi4-mini"
    else
        print_status "✅ phi4-mini model is available"
    fi
    
    print_status "Starting backend server on http://localhost:8000..."
    cd backend
    source ../venv/bin/activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    sleep 3
    print_status "Backend server started (PID: $BACKEND_PID)"
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend development server on http://localhost:3000..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    sleep 3
    print_status "Frontend server started (PID: $FRONTEND_PID)"
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_status "Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_status "Frontend server stopped"
    fi
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null
        print_status "Ollama server stopped"
    fi
    exit 0
}

# Trap cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start both servers
start_backend
start_frontend

echo ""
print_status "🚀 HouseHelp.AI is now running!"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend API:${NC} http://localhost:8000"
echo -e "${BLUE}API Docs:${NC} http://localhost:8000/docs"
echo ""
print_warning "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait