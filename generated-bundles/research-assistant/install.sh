#!/bin/bash

echo "Installing Research Assistant..."

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create workspace directory
echo "Creating workspace directory..."
mkdir -p "./research"

# Set up environment variables
echo ""
echo "Setup Instructions:"
echo "• Create a 'research' folder for your findings and notes"
echo "• Get a free Brave Search API key from https://brave.com/search/api/"
echo "• Set your BRAVE_API_KEY environment variable"

echo ""
echo "To use this bundle:"
echo "1. Update your Claude Desktop config with:"
echo '   "mcpServers": {'
echo '     "research-assistant": {'
echo '       "command": "bash",'
echo '       "args": ["'$(pwd)'/run.sh"]'
echo '     }'
echo '   }'
echo ""
echo "2. Restart Claude Desktop"
echo "3. Try these tasks:"
echo "   • Research the latest developments in AI safety"
echo "   • Find and summarize academic papers on a topic"
echo "   • Create a comprehensive research report"
echo "   • Build a knowledge map of related concepts"

echo ""
echo "Installation complete! 🎉"
