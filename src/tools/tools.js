import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from 'zod';

function getServer() {
  const server = new Server({
    name: "fluree-transactor",
    version: "1.0.0"
  });

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

  // ✅ Fully typed schema with literal method + params
  const schema = z.object({
    method: z.literal("flureeTransact"),
    params: z.object({
      count: z.number().min(1).max(50).default(1)
    })
  });

  server.setRequestHandler(schema, async ({ params }) => {
    const { count } = params;
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(await sendTransaction(i));
    }
    return { results };
  });

  return server;
}

export { getServer };
