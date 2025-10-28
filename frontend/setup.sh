#!/bin/bash

# HouseHelp.AI Frontend Setup Script

echo "Setting up HouseHelp.AI Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

echo "Frontend setup complete!"
echo "To start the development server, run: npm start"