#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { router } from "./router.js";
import { VERSION } from "./common/version.js";

// Initialize the MCP server
const server = new Server(
  {
    name: "as-router",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register request handlers
server.setRequestHandler(ListToolsRequestSchema, router.listTools);
server.setRequestHandler(CallToolRequestSchema, router.callTool);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AS Router MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in server:", error);
  process.exit(1);
});