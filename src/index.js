import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import * as config from "./config/constant.js";
import tools from './tools/index.js';


const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {}; // this will store all the trasport connection.  as the session id as key and transport obj as value
// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  console.log(req.headers) ;
  const sessionId = req.headers['mcp-session-id'];
  // NEW: Read dbUrl, network, ledger from headers if present
  const headerDbUrl = req.headers['dburl'];
  const headerNetwork = req.headers['network'];
  const headerLedger = req.headers['ledger'];
  let transport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
    // NEW: Optionally update connectionInfo from headers for existing session
    if (headerDbUrl || headerNetwork || headerLedger) {
      transport.connectionInfo = {
        dbUrl: headerDbUrl || transport.connectionInfo?.dbUrl || config.FLUREE_DB_URL,
        network: headerNetwork || transport.connectionInfo?.network || config.FLUREE_NETWORK,
        ledger: headerLedger || transport.connectionInfo?.ledger || config.FLUREE_LEDGER
      };
    }
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    // NEW: Prefer headers, then body params, then config
    const { dbUrl, network, ledger } = req.body.params || {};
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      }
    });
    // Store connection info in the transport/session object
    transport.connectionInfo = {
      dbUrl: headerDbUrl || dbUrl || config.FLUREE_DB_URL ,
      network: headerNetwork || network || config.FLUREE_NETWORK ,
      ledger: headerLedger || ledger || config.FLUREE_LEDGER 
    };
    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = new McpServer({
      name: "Fluree_MCP_Server",
      version: "1.0.0"
    });
    // Register all tools from the tools directory, wrapping handlers to inject context
    for (const tool of tools) {
      if (!tool.handler) continue;
      // Wrap the handler to inject session context
      server.registerTool(tool.name, tool.config, async (params, context = {}) => {
        // Attach connectionInfo from transport if available
        const session = context.session || {};
        session.connectionInfo = transport.connectionInfo;
        return tool.handler(params, session);
      });
    }
    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }
  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};
// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(config.Port, () => {
  console.log(`MCP Statefull Streamable HTTP Server listening on port ${config.Port}`);
});
