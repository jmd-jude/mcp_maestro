#!/bin/bash

echo "Installing Content Creator..."

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create workspace directory
echo "Creating workspace directory..."
mkdir -p "./workspace"

# Set up environment variables
echo ""
echo "Setup Instructions:"
echo "• Create a 'workspace' folder where your content files will be stored"
echo "• Get a free Brave Search API key from https://brave.com/search/api/"
echo "• Set your BRAVE_API_KEY environment variable"

echo ""
echo "To use this bundle:"
echo "1. Update your Claude Desktop config with:"
echo '   "mcpServers": {'
echo '     "content-creator": {'
echo '       "command": "'$(pwd)'/run.sh"'
echo '     }'
echo '   }'
echo ""
echo "2. Restart Claude Desktop"
echo "3. Try these tasks:"
echo "   • Ask me to research trending topics in your niche"
echo "   • Have me create a content calendar file"
echo "   • Store important brand guidelines in memory"
echo "   • Generate and save draft blog posts"

echo ""
echo "Installation complete! 🎉"
