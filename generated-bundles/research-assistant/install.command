#!/bin/bash
clear
echo "🚀 Installing Research Assistant..."
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
mkdir -p "./research"
echo "✅ Workspace created at: ./research"

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
    "research-assistant": {
      "command": "bash",
      "args": ["$(pwd)/run.sh"]
    }
  }
}
EOF

echo "✅ Config saved to: claude_config.json"
echo ""

echo "🔧 SETUP INSTRUCTIONS:"
echo "   • Create a 'research' folder for your findings and notes"
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
echo "   • Research the latest developments in AI safety"
echo "   • Find and summarize academic papers on a topic"
echo "   • Create a comprehensive research report"
echo "   • Build a knowledge map of related concepts"

echo ""
echo "✨ Happy creating! Press any key to close..."
read -n 1
