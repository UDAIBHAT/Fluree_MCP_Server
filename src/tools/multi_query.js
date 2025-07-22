import { z } from 'zod';
import * as config from "../config/constant.js";


export default {
  name: "flureeMultiQueryTool",
  config: {
    title: "Fluree Multi-Query Tool",
    description: "Sends multiple FlureeQL queries in a single request to the multi-query endpoint.",
    inputSchema: {
      queries: z.record(
        z.string(),
        z.object({
          select: z.array(z.string()).default(["*"]),
          from: z.string().default("_collection")
        })
      ).default({
        query1: { select: ["*"], from: "_collection" },
        query2: { select: ["*"], from: "_predicate" }
      })
    }
  },
  handler: async ({ queries }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL }/fdb/${network || config.FLUREE_NETWORK }/${ledger || config.FLUREE_LEDGER}/multi-query`;
    const multiQueryResult = await executeMultiQuery(url, queries);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(multiQueryResult, null, 2)
        }
      ]
    };
  }
};

// Function to construct the multi-query and send it to Fluree
async function executeMultiQuery(url, queries) {
  const opt = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queries)
  };

  try {
    const response = await fetch(url, opt);
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
