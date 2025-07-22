import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeQueryTool",
  config: {
    title: "Fluree Query Tool",
    description: "Queries Fluree database to select collections or other data using FlureeQL syntax.",
    inputSchema: {
      selectFields: z.array(z.string()).default(["*"]),
      fromCollection: z.string().default("_collection")
    }
  },
  handler: async ({ selectFields = ["*"], fromCollection = "_collection" }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL }/fdb/${network || config.FLUREE_NETWORK }/${ledger || config.FLUREE_LEDGER}/query`;
    const queryResult = await executeFlureeQuery(url, selectFields, fromCollection);
    return {
      content: [
        {
          type: "text",
          text: `Fluree Query Result:\n\n` + JSON.stringify(queryResult, null, 2)
        }
      ]
    };
  }
};

// Function to construct the query and send it to Fluree
async function executeFlureeQuery(url, selectFields, fromCollection) {
  const query = {
    select: selectFields,
    from: fromCollection
  };

  const opt = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  };

  try {
    const response = await fetch(url, opt);
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
