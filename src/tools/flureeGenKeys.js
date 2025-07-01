import { z } from 'zod';

export default {
  name: "flureeNewKeysTool",
  config: {
    title: "Fluree New Keys Tool",
    description: "Fetches a new public key, private key, and auth-id from Fluree.",
    inputSchema: {
      method: z.enum(["GET", "POST"]).default("POST") // Allows the user to choose between GET or POST
    }
  },
  handler: async ({ method }) => {
    const keys = await fetchNewKeys(method);
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
async function fetchNewKeys(method) {
  const url = "http://localhost:8090/fdb/new-keys";  // Fluree endpoint to fetch new keys
  
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: method === "POST" ? JSON.stringify({}) : null // Empty object for POST method
  };

  try {
    const response = await fetch(url, options);
    
    const result = await response.json();
    // console.log(result);
    return { success: true, data: result };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
