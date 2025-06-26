import { z } from 'zod';

export default {
  name: "flureeBlockQueryTool",
  config: {
    title: "Fluree Block Query Tool",
    description: "Queries a specific block in Fluree database.",
    inputSchema: {
      block: z.number().min(1).default(5) // Default block number is 5
    }
  },
  handler: async ({ block }) => {
    const blockResult = await executeBlockQuery(block);
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

const url = "http://localhost:8090/fdb/ssbd/amc/block";
// Function to construct the block query and send it to Fluree
async function executeBlockQuery(block) {
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
