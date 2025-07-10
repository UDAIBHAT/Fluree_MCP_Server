import { z } from 'zod';

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

  handler: async ({ start, end }) => {
    // Construct the URL for the block-range-with-txn endpoint
    const url = `http://localhost:8090/fdb/ssbd/amc/block-range-with-txn`;

    // Prepare the request body with the block range
    const body = {
      start: start,
      end: end
    };

    // Fetch the block stats and transactions
    const result = await fetchBlockRangeWithTxn(url, body);

    // Return the response
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
