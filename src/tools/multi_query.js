import { z } from 'zod';

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
  handler: async ({ queries }) => {
    const multiQueryResult = await executeMultiQuery(queries);
    return {
      content: [
        {
          type: "text",
          text: `✅ Fluree Multi-Query Result:\n\n` + JSON.stringify(multiQueryResult, null, 2)
        }
      ]
    };
  }
};

const url = "http://localhost:8090/fdb/ssbd/amc/multi-query";

// Function to construct the multi-query and send it to Fluree
async function executeMultiQuery(queries) {
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
