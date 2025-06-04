#!/bin/bash
clear
echo "🚀 Installing Data Analyst..."
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
mkdir -p "./data"
echo "✅ Workspace created at: ./data"

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
    "data-analyst": {
      "command": "bash",
      "args": ["$(pwd)/run.sh"]
    }
  }
}
EOF

echo "✅ Config saved to: claude_config.json"
echo ""

echo "🔧 SETUP INSTRUCTIONS:"
echo "   • Create a 'data' folder for your datasets and analysis outputs"
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
echo "   • Analyze sales data from a CSV file"
echo "   • Research industry benchmarks for comparison"
echo "   • Generate insights and save them to a report"
echo "   • Remember analysis patterns for future use"

echo ""
echo "✨ Happy creating! Press any key to close..."
read -n 1
