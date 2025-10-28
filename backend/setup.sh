#!/bin/bash

# HouseHelp.AI Backend Setup Script

echo "Setting up HouseHelp.AI Backend..."

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if Ollama is running
echo "Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is installed"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama is running"
        
        # Check if phi4-mini is available
        if ollama list | grep -q "phi4-mini"; then
            echo "✅ phi4-mini model is available"
        else
            echo "⚠️  phi4-mini model not found"
            echo "📥 Pulling phi4-mini model (this may take a while)..."
            ollama pull phi4-mini
        fi
    else
        echo "⚠️  Ollama is not running. Please start Ollama first:"
        echo "   ollama serve"
    fi
else
    echo "❌ Ollama is not installed. Please install Ollama first:"
    echo "   Visit: https://ollama.ai"
    echo "   Then run: ollama pull phi4-mini"
fi

# Create database
echo "Setting up database..."
python -c "from app.database import create_tables, initialize_sample_data; create_tables(); initialize_sample_data(); print('Database initialized successfully!')"

# Create uploads directory
mkdir -p uploads

echo "Backend setup complete!"
echo ""
echo "To start the server:"
echo "1. Make sure Ollama is running: ollama serve"
echo "2. Run: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"