import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { sendTransaction } from "./trac.js";
import {z} from "zod";

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";








const server = new McpServer({
    name: "Fluree_MCP",
    version: "1.0.0",

});
server.


server.registerTool('random_transaction',
    {
        title: "transactions",
        description: "tool for all the insertions",
        

    },
    async()=>{
        const result = await sendTransaction(6);
        
        
        return {content : [{ type:"text", text: JSON.stringify(result)  }]};
    }
);























async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });