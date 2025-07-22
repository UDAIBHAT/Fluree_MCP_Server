import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeBlockRangeWithTxnTool",
  config: {
    title: "Fluree Block Range with Transactions Tool",
    description: "Fetches block stats and transactions for a specified range of blocks in Fluree.",
    inputSchema: {
      start: z.number().min(1).default(1), // Start block
      end: z.number().min(1).default(2) // End block
    }
  },

  handler: async ({ start, end }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL }/fdb/${network || config.FLUREE_NETWORK }/${ledger || config.FLUREE_LEDGER}/block-range-with-txn`;
    const body = {
      start: start,
      end: end
    };
    const result = await fetchBlockRangeWithTxn(url, body);
    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `✅ Successfully fetched block range stats and transactions for blocks ${start} to ${end}:\n\n` + JSON.stringify(result.data, null, 2)
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch block range stats: ${result.error}`
          }
        ]
      };
    }
  }
};

// Function to send the request and fetch block range with transactions
async function fetchBlockRangeWithTxn(url, body) {
  const options = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
