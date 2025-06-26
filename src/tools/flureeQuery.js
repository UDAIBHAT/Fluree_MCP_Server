import { z } from 'zod';

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
  handler: async ({ selectFields = ["*"], fromCollection = "_collection" }) => {
    const queryResult = await executeFlureeQuery(selectFields, fromCollection);
    return {
      content: [
        {
          type: "text",
          text: `✅ Fluree Query Result:\n\n` + JSON.stringify(queryResult, null, 2)
        }
      ]
    };
  }
};

const url = "http://localhost:8090/fdb/ssbd/amc/query";  // Adjust as per your network/ledger names

// Function to construct the query and send it to Fluree
async function executeFlureeQuery(selectFields, fromCollection) {
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
