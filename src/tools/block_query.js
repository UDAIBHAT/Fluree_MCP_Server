import { z } from 'zod';
import * as config from "../config/constant.js";


export default {
  name: "flureeBlockQueryTool",
  config: {
    title: "Fluree Block Query Tool",
    description: "Queries a specific block in Fluree database.",
    inputSchema: {
      block: z.number().min(1).default(5) // Default block number is 5
    }
  },
  handler: async ({ block }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL }/fdb/${network || config.FLUREE_NETWORK }/${ledger || config.FLUREE_LEDGER}/block`;
    const blockResult = await executeBlockQuery(url, block);
    return {
      content: [
        {
          type: "text",
          text: `✅ Fluree Block Query Result for Block ${block}:\n\n` + JSON.stringify(blockResult, null, 2)
        }
      ]
    };
  }
};

// Function to construct the block query and send it to Fluree
async function executeBlockQuery(url, block) {
  const query = {
    block: block
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
