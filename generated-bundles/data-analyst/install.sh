#!/bin/bash

echo "Installing Data Analyst..."

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create workspace directory
echo "Creating workspace directory..."
mkdir -p "./data"

# Set up environment variables
echo ""
echo "Setup Instructions:"
echo "• Create a 'data' folder for your datasets and analysis outputs"
echo "• Get a free Brave Search API key from https://brave.com/search/api/"
echo "• Set your BRAVE_API_KEY environment variable"

echo ""
echo "To use this bundle:"
echo "1. Update your Claude Desktop config with:"
echo '   "mcpServers": {'
echo '     "data-analyst": {'
echo '       "command": "bash",'
echo '       "args": ["'$(pwd)'/run.sh"]'
echo '     }'
echo '   }'
echo ""
echo "2. Restart Claude Desktop"
echo "3. Try these tasks:"
echo "   • Analyze sales data from a CSV file"
echo "   • Research industry benchmarks for comparison"
echo "   • Generate insights and save them to a report"
echo "   • Remember analysis patterns for future use"

echo ""
echo "Installation complete! 🎉"
