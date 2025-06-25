import { z } from 'zod';




export default {
  name: "flureeTransact",
  config: {
    title: "Fluree Transaction Tool",
    description: "Creates multiple random collections in Fluree DB.",
    inputSchema:{
      count: z.number().min(1).max(50).default(1)
    }
  },
  handler: async ({ count = 1 }) => {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(await sendTransaction(i + 1));
    }
    return {
      content: [
        {
          type: "text",
          text: `✅ ${count} collections created:\n\n` + JSON.stringify(results, null, 2)
        }
      ]
    };
  }
}; 





const url = "http://localhost:8090/fdb/ssbd/amc/transact";
function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}
function createTransactionQuery(index) {
  return [{
    "_id": "_collection",
    "name": `test_${generateRandomString()}_${index}`
  }];
}
async function sendTransaction(index) {
  const query = createTransactionQuery(index);
  const opt = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  };
  try {
    const response = await fetch(url, opt);
    const result = await response.json();
    return { success: true, index, data: result };
  } catch (error) {
    return { success: false, index, error: error.message };
  }
}
