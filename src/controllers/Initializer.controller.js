import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import * as config from "../config/constant.js";
import tools from '../tools/index.js';
import { getConnectionInfo, validateConnectionInfo } from "../utils/ConnectionInfo.js";



const transports = {};
const Initializer = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    const connectionInfo = getConnectionInfo(req);
    const missingFields = validateConnectionInfo(connectionInfo);
    let transport;

    // Check for missing required fields
    if (missingFields.length > 0) {
        return res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32001,
                message: `Missing required parameter(s): ${missingFields.join(', ')}`,
            },
            id: req.body?.id ?? null,
        });
    }

    if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
        // Optionally update connectionInfo for existing session
        transport.connectionInfo = {
            dbUrl: connectionInfo.dbUrl || transport.connectionInfo?.dbUrl || config.FLUREE_DB_URL,
            network: connectionInfo.network || transport.connectionInfo?.network || config.FLUREE_NETWORK,
            ledger: connectionInfo.ledger || transport.connectionInfo?.ledger || config.FLUREE_LEDGER,
        };
    } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                transports[sessionId] = transport;
            }
        });

        transport.connectionInfo = {
            dbUrl: connectionInfo.dbUrl,
            network: connectionInfo.network,
            ledger: connectionInfo.ledger
        };

        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };

        const server = new McpServer({
            name: "Fluree_MCP_Server",
            version: "1.0.0"
        });

        for (const tool of tools) {
            if (!tool.handler) continue;
            server.registerTool(tool.name, tool.config, async (params, context = {}) => {
                const session = context.session || {};
                session.connectionInfo = transport.connectionInfo;
                return tool.handler(params, session);
            });
        }

        await server.connect(transport);
    } else {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
            },
            id: req.body?.id ?? null,
        });
        return;
    }

    await transport.handleRequest(req, res, req.body);
}

const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).send('Invalid or missing session ID');
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

export { Initializer, handleSessionRequest }