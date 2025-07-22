import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeNewKeysTool",
  config: {
    title: "Fluree New Keys Tool",
    description: "Fetches a new public key, private key, and auth-id from Fluree.",
    inputSchema: {
      method: z.enum(["GET", "POST"]).default("POST") // Allows the user to choose between GET or POST
    }
  },
  handler: async ({ method }, session = {}) => {
    const { dbUrl } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL}/fdb/new-keys`;
    const keys = await fetchNewKeys(url, method);
    if (keys.success) {
      return {
        content: [
          {
            type: "text",
            text: `✅ Successfully fetched keys from Fluree: ${keys.data.public}\nPrivate Key: ${keys.data.private}\nAuth-ID: ${keys.data["account-id"]}`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch keys: ${keys.error}`
          }
        ]
      };
    }
  }
};

// Function to fetch new keys from Fluree
async function fetchNewKeys(url, method) {
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: method === "POST" ? JSON.stringify({}) : null // Empty object for POST method
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
