import  * as config from "./config/constant.js"
import { getServer } from "./tools/tools.js";
import express  from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";



const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  // In stateless mode, create a new instance of transport and server for each request
  // to ensure complete isolation. A single instance would cause request ID collisions
  // when multiple clients connect concurrently.
  
  try {
    const server = getServer(); 
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req, res) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

app.delete('/mcp', async (req, res) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});


// Start the server

app.listen(config.Port, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${config.Port}`);
});





// const server = new McpServer({
//     name: "Fluree_MCP",
//     version: "1.0.0",

// });



//     server.registerTool('random_transaction',
//         {
//             title: "transactions",
//             description: "tool for all the insertions",


//         },
//         async () => {
//             const result = await sendTransaction(6);


//             return { content: [{ type: "text", text: JSON.stringify(result) }] };
//         }
//     );























// async function main() {
//     const transport = new StdioServerTransport();
//     await server.connect(transport);
//     console.error("Weather MCP Server running on stdio");
// }

// main().catch((error) => {
//     console.error("Fatal error in main():", error);
//     process.exit(1);
// });