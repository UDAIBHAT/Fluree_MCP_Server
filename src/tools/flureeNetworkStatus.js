

export default {
  name: "flureeNetworkStatus",
  config: {
    title: "Fluree Network Status Tool",
    description: "Retrieves the current status of the Fluree network including raft state, list of servers, ledgers, and queued transactions.",
    inputSchema: {
      // No input parameters for this tool
    }
  },
  handler: async () => {
    const status = await getNetworkStatus();
    return {
      content: [
        {
          type: "text",
          text: `✅ Fluree Network Status:\n\n` + JSON.stringify(status, null, 2)
        }
      ]
    };
  }
};

const url = "http://localhost:8090/fdb/nw-state";

async function getNetworkStatus() {
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
