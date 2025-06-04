#!/bin/bash

echo "Installing Developer Assistant..."

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create workspace directory
echo "Creating workspace directory..."
mkdir -p "./projects"

# Set up environment variables
echo ""
echo "Setup Instructions:"
echo "• Create a 'projects' folder for your development workspace"
echo "• Get a free Brave Search API key from https://brave.com/search/api/"
echo "• Set your BRAVE_API_KEY environment variable"

echo ""
echo "To use this bundle:"
echo "1. Update your Claude Desktop config with:"
echo '   "mcpServers": {'
echo '     "developer-assistant": {'
echo '       "command": "'$(pwd)'/run.sh"'
echo '     }'
echo '   }'
echo ""
echo "2. Restart Claude Desktop"
echo "3. Try these tasks:"
echo "   • Help me debug this code file"
echo "   • Search for best practices for this framework"
echo "   • Remember the architecture decisions for this project"
echo "   • Create boilerplate code for a new feature"

echo ""
echo "Installation complete! 🎉"
