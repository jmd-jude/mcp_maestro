#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BundleGenerator {
  constructor() {
    this.bundlesDir = path.join(__dirname, '../bundles');
    this.outputDir = path.join(__dirname, '../generated-bundles');
  }

  async generateBundle(bundleId) {
    console.log(`Generating bundle: ${bundleId}`);
    
    // Load bundle definition
    const bundlePath = path.join(this.bundlesDir, `${bundleId}.json`);
    const bundleConfig = JSON.parse(await fs.readFile(bundlePath, 'utf8'));
    
    // Create output directory
    const outputPath = path.join(this.outputDir, bundleId);
    await fs.mkdir(outputPath, { recursive: true });
    
    // Generate orchestrator code
    await this.generateOrchestrator(bundleConfig, outputPath);
    
    // Generate package.json
    await this.generatePackageJson(bundleConfig, outputPath);
    
    // Generate run script
    await this.generateRunScript(bundleConfig, outputPath);
    
    // Generate installer script
    await this.generateInstaller(bundleConfig, outputPath);
    
    // Generate README
    await this.generateReadme(bundleConfig, outputPath);
    
    console.log(`Bundle generated at: ${outputPath}`);
    return outputPath;
  }

  async generateOrchestrator(bundleConfig, outputPath) {
    const orchestratorCode = `#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ${this.toPascalCase(bundleConfig.id)}Orchestrator {
  constructor() {
    this.server = new Server(
      {
        name: "${bundleConfig.id}",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.childServers = new Map();
    this.allTools = new Map();
    
    this.setupToolHandlers();
    this.setupListeners();
  }

  async startChildServer(name, command, args = []) {
    console.error(\`Starting $\{name} server...\`);
    
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: __dirname
    });

    this.childServers.set(name, child);
    child.stdin.setDefaultEncoding('utf8');

    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "${bundleConfig.id}", version: "1.0.0" }
      }
    };

    child.stdin.write(JSON.stringify(initRequest) + '\\n');

    let buffer = '';
    child.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.method === 'tools/list' || response.result?.tools) {
              this.handleToolsList(name, response);
            }
          } catch (e) {
            console.error(\`Error parsing response from $\{name}:\`, e);
          }
        }
      }
    });

    setTimeout(() => {
      const toolsRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
      };
      child.stdin.write(JSON.stringify(toolsRequest) + '\\n');
    }, 1000);

    return child;
  }

  handleToolsList(serverName, response) {
    if (response.result && response.result.tools) {
      console.error(\`Got tools from $\{serverName}:\`, response.result.tools.map(t => t.name));
      
      for (const tool of response.result.tools) {
        const prefixedName = \`\${serverName}_\${tool.name}\`;
        this.allTools.set(prefixedName, {
          ...tool,
          name: prefixedName,
          originalName: tool.name,
          serverName: serverName
        });
      }
    }
  }

  async callToolOnChildServer(serverName, toolName, args) {
    const child = this.childServers.get(serverName);
    if (!child) {
      throw new McpError(ErrorCode.InternalError, \`Server $\{serverName} not found\`);
    }

    return new Promise((resolve, reject) => {
      const requestId = Date.now();
      const request = {
        jsonrpc: "2.0",
        id: requestId,
        method: "tools/call",
        params: { name: toolName, arguments: args }
      };

      const handleResponse = (data) => {
        const lines = data.toString().split('\\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === requestId) {
                child.stdout.removeListener('data', handleResponse);
                if (response.error) {
                  reject(new McpError(ErrorCode.InternalError, response.error.message));
                } else {
                  resolve(response.result);
                }
              }
            } catch (e) {
              // Ignore parsing errors for non-matching responses
            }
          }
        }
      };

      child.stdout.on('data', handleResponse);
      child.stdin.write(JSON.stringify(request) + '\\n');

      setTimeout(() => {
        child.stdout.removeListener('data', handleResponse);
        reject(new McpError(ErrorCode.InternalError, "Tool call timeout"));
      }, 30000);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: Array.from(this.allTools.values()) };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.allTools.get(name);
      if (!tool) {
        throw new McpError(ErrorCode.InvalidRequest, \`Unknown tool: $\{name}\`);
      }

      try {
        const result = await this.callToolOnChildServer(
          tool.serverName, 
          tool.originalName, 
          args || {}
        );
        return result;
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          \`Tool execution failed: $\{error.message}\`
        );
      }
    });
  }

  setupListeners() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      console.error("Shutting down orchestrator...");
      for (const [name, child] of this.childServers) {
        console.error(\`Stopping $\{name}...\`);
        child.kill();
      }
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
${bundleConfig.servers.map(server => `    await this.startChildServer(
      '${server.name}',
      'npx',
      ['${server.package}'${server.args.length > 0 ? ', ' + server.args.map(arg => `'${arg}'`).join(', ') : ''}]
    );`).join('\n\n')}

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("${bundleConfig.name} orchestrator running on stdio");
  }
}

const orchestrator = new ${this.toPascalCase(bundleConfig.id)}Orchestrator();
orchestrator.start().catch(console.error);`;

    await fs.writeFile(path.join(outputPath, 'index.js'), orchestratorCode);
  }

  async generatePackageJson(bundleConfig, outputPath) {
    const packageJson = {
      name: bundleConfig.id,
      version: "1.0.0",
      description: bundleConfig.description,
      main: "index.js",
      type: "module",
      scripts: {
        start: "node index.js",
        "install-deps": "npm install"
      },
      keywords: ["mcp", "ai", "assistant", bundleConfig.id],
      author: "",
      license: "MIT",
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.12.1",
        ...Object.fromEntries(bundleConfig.servers.map(server => [server.package, "latest"]))
      }
    };

    await fs.writeFile(
      path.join(outputPath, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
  }

  async generateRunScript(bundleConfig, outputPath) {
    const runScript = `#!/bin/bash
cd "$(dirname "$0")"
node index.js`;

    await fs.writeFile(path.join(outputPath, 'run.sh'), runScript);
    await fs.chmod(path.join(outputPath, 'run.sh'), 0o755);
  }

  async generateInstaller(bundleConfig, outputPath) {
    const workspaceDir = bundleConfig.servers.find(s => s.name === 'filesystem')?.args[0] || './workspace';
    
    const installer = `#!/bin/bash

echo "Installing ${bundleConfig.name}..."

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create workspace directory
echo "Creating workspace directory..."
mkdir -p "${workspaceDir}"

# Set up environment variables
echo ""
echo "Setup Instructions:"
${bundleConfig.setupInstructions.map(instruction => `echo "• ${instruction}"`).join('\n')}

echo ""
echo "To use this bundle:"
echo "1. Update your Claude Desktop config with:"
echo '   "mcpServers": {'
echo '     "${bundleConfig.id}": {'
echo '       "command": "bash",'
echo '       "args": ["'$(pwd)'/run.sh"]'
echo '     }'
echo '   }'
echo ""
echo "2. Restart Claude Desktop"
echo "3. Try these tasks:"
${bundleConfig.demoTasks.map(task => `echo "   • ${task}"`).join('\n')}

echo ""
echo "Installation complete! 🎉"
`;

    await fs.writeFile(path.join(outputPath, 'install.sh'), installer);
    await fs.chmod(path.join(outputPath, 'install.sh'), 0o755);
  }

  async generateReadme(bundleConfig, outputPath) {
    const readme = `# ${bundleConfig.name}

${bundleConfig.description}

## Features

${bundleConfig.features.map(feature => `- ${feature}`).join('\n')}

## Quick Setup

1. Run the installer:
   \`\`\`bash
   ./install.sh
   \`\`\`

2. Update your Claude Desktop configuration file (\`~/Library/Application Support/Claude/claude_desktop_config.json\`):
   \`\`\`json
   {
     "mcpServers": {
       "${bundleConfig.id}": {
         "command": "/path/to/this/folder/run.sh"
       }
     }
   }
   \`\`\`

3. Restart Claude Desktop

## Setup Instructions

${bundleConfig.setupInstructions.map(instruction => `- ${instruction}`).join('\n')}

## What You Can Do

${bundleConfig.demoTasks.map(task => `- ${task}`).join('\n')}

## Included Tools

${bundleConfig.servers.map(server => `### ${server.name}
${server.description}
${server.requiresApiKey ? `**Requires API Key:** ${server.apiKeyName}` : ''}`).join('\n\n')}

## Troubleshooting

If the tools don't appear in Claude Desktop:
1. Make sure the path in your config is correct
2. Check that the run.sh script is executable
3. Restart Claude Desktop completely
4. Check the Claude Desktop logs for errors

## Support

This bundle was generated by MCP Maestro - the tool for creating unified AI assistant experiences.
`;

    await fs.writeFile(path.join(outputPath, 'README.md'), readme);
  }

  toPascalCase(str) {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }
}

// CLI usage
const bundleId = process.argv[2];
if (!bundleId) {
  console.error('Usage: node generate-bundle.js <bundle-id>');
  console.error('Available bundles: content-creator, developer-assistant, research-assistant, data-analyst');
  process.exit(1);
}

const generator = new BundleGenerator();
generator.generateBundle(bundleId).catch(console.error);