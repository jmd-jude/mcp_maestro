#!/bin/bash
clear
echo "🚀 Installing Content Creator..."
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
mkdir -p "./workspace"
echo "✅ Workspace created at: ./workspace"

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
    "content-creator": {
      "command": "bash",
      "args": ["$(pwd)/run.sh"]
    }
  }
}
EOF

echo "✅ Config saved to: claude_config.json"
echo ""

echo "🔧 SETUP INSTRUCTIONS:"
echo "   • Create a 'workspace' folder where your content files will be stored"
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
echo "   • Ask me to research trending topics in your niche"
echo "   • Have me create a content calendar file"
echo "   • Store important brand guidelines in memory"
echo "   • Generate and save draft blog posts"

echo ""
echo "✨ Happy creating! Press any key to close..."
read -n 1
