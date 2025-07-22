import { z } from 'zod';
import * as config from "../config/constant.js";


export default {
  name: "flureeHistoryQueryTool",
  config: {
    title: "Fluree History Query Tool",
    description: "Queries the history of a specific entity from the Fluree database.",
    inputSchema: {
      history: z.array(z.string()).default(["person/handle", "zsmith"]), // Default entity for history
      block: z.number().min(1).default(4)  // Default block number
    }
  },
  handler: async ({ history, block }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL }/fdb/${network || config.FLUREE_NETWORK }/${ledger || config.FLUREE_LEDGER}/history`;
    const historyResult = await executeHistoryQuery(url, history, block);
    return {
      content: [
        {
          type: "text",
          text: `Fluree History Query Result for ${history.join(", ")} at Block ${block}:\n\n` + JSON.stringify(historyResult, null, 2)
        }
      ]
    };
  }
};

// Function to construct the history query and send it to Fluree
async function executeHistoryQuery(url, history, block) {
  const query = {
    history: history,
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
