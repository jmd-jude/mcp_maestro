#!/usr/bin/env node

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

class MCPOrchestrator {
  constructor() {
    this.server = new Server(
      {
        name: "mcp-orchestrator",
        version: "0.1.0",
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
    console.error(`Starting ${name} server...`);
    
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: join(__dirname, '../servers')
    });

    // Store the child process
    this.childServers.set(name, child);

    // Set up communication
    child.stdin.setDefaultEncoding('utf8');

    // Send initialization request
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: "mcp-orchestrator",
          version: "0.1.0"
        }
      }
    };

    child.stdin.write(JSON.stringify(initRequest) + '\n');

    // Handle responses
    let buffer = '';
    child.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.method === 'tools/list' || response.result?.tools) {
              this.handleToolsList(name, response);
            }
          } catch (e) {
            console.error(`Error parsing response from ${name}:`, e);
          }
        }
      }
    });

    // Request tools list after initialization
    setTimeout(() => {
      const toolsRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
      };
      child.stdin.write(JSON.stringify(toolsRequest) + '\n');
    }, 1000);

    return child;
  }

  handleToolsList(serverName, response) {
    if (response.result && response.result.tools) {
      console.error(`Got tools from ${serverName}:`, response.result.tools.map(t => t.name));
      
      for (const tool of response.result.tools) {
        // Prefix tool names with server name to avoid conflicts
        const prefixedName = `${serverName}_${tool.name}`;
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
      throw new McpError(ErrorCode.InternalError, `Server ${serverName} not found`);
    }

    return new Promise((resolve, reject) => {
      const requestId = Date.now();
      const request = {
        jsonrpc: "2.0",
        id: requestId,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      // Set up response handler
      const handleResponse = (data) => {
        const lines = data.toString().split('\n');
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
      child.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        child.stdout.removeListener('data', handleResponse);
        reject(new McpError(ErrorCode.InternalError, "Tool call timeout"));
      }, 30000);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.allTools.values())
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.allTools.get(name);
      if (!tool) {
        throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${name}`);
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
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  setupListeners() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      console.error("Shutting down orchestrator...");
      for (const [name, child] of this.childServers) {
        console.error(`Stopping ${name}...`);
        child.kill();
      }
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    // Start child servers
    await this.startChildServer(
      'filesystem',
      'npx',
      ['@modelcontextprotocol/server-filesystem', '/Users/JudeHoffner/Desktop/MCP_maestro']
    );

    await this.startChildServer(
      'memory',
      'npx',
      ['@modelcontextprotocol/server-memory']
    );

    // Start the main server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Orchestrator running on stdio");
  }
}

// Start the orchestrator
const orchestrator = new MCPOrchestrator();
orchestrator.start().catch(console.error);