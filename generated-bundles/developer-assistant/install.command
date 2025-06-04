#!/bin/bash
clear
echo "🚀 Installing Developer Assistant..."
echo "=================================================="
echo ""

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

echo ""

# Create workspace directory
echo "📁 Creating workspace directory..."
mkdir -p "./projects"
echo "✅ Workspace created at: ./projects"

echo ""
echo "=================================================="
echo "🎉 Installation Complete!"
echo "=================================================="
echo ""

# Generate Claude Desktop config
echo "📋 Generating Claude Desktop configuration..."
cat > claude_config.json << 'EOF'
{
  "mcpServers": {
    "developer-assistant": {
      "command": "bash",
      "args": ["$(pwd)/run.sh"]
    }
  }
}
EOF

echo "✅ Config saved to: claude_config.json"
echo ""

echo "🔧 SETUP INSTRUCTIONS:"
echo "   • Create a 'projects' folder for your development workspace"
echo "   • Get a free Brave Search API key from https://brave.com/search/api/"
echo "   • Set your BRAVE_API_KEY environment variable"

echo ""
echo "📋 NEXT STEP - Update Claude Desktop:"
echo "   1. Open: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "   2. Add this configuration (or merge with existing):"
echo ""
echo "   ----------------------------------------"
cat claude_config.json
echo "   ----------------------------------------"
echo ""
echo "   3. Restart Claude Desktop"
echo ""
echo "🎯 TRY THESE TASKS:"
echo "   • Help me debug this code file"
echo "   • Search for best practices for this framework"
echo "   • Remember the architecture decisions for this project"
echo "   • Create boilerplate code for a new feature"

echo ""
echo "✨ Happy creating! Press any key to close..."
read -n 1
