import * as config from "../config/constant.js";


export default {
  name: "flureeNetworkStatus",
  config: {
    title: "Fluree Network Status Tool",
    description: "Retrieves the current status of the Fluree network including raft state, list of servers, ledgers, and queued transactions.",
    inputSchema: {
      // No input parameters for this tool
    }
  },
  handler: async (_params, session = {}) => {
    const { dbUrl } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL}/fdb/nw-state`;
    // console.log(dbUrl);
    
    const status = await getNetworkStatus(url);
    return {
      content: [
        {
          type: "text",
          text: `Fluree Network Status:\n\n` + JSON.stringify(status, null, 2)
        }
      ]
    };
  }
};

async function getNetworkStatus(url) {
  const opt = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: null // No body required for this request
  };
  try {
    const response = await fetch(url, opt);
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
