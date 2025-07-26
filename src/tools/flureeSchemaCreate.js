import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeSchemaCreate",
  config: {
    title: "Fluree Schema Creation Tool",
    description: "Creates new collections and predicates in Fluree database with proper schema definitions.",
    inputSchema: {
      collectionName: z.string().min(1).describe("Name of the collection to create"),
      predicates: z.array(z.object({
        name: z.string().min(1).describe("Predicate name"),
        type: z.enum(["string", "int", "long", "float", "double", "boolean", "instant", "uuid", "uri", "bytes", "ref"]).describe("Data type"),
        doc: z.string().optional().describe("Documentation for the predicate"),
        unique: z.boolean().optional().default(false).describe("Whether the predicate should be unique"),
        multi: z.boolean().optional().default(false).describe("Whether the predicate can have multiple values"),
        index: z.boolean().optional().default(false).describe("Whether to create an index"),
        restrictCollection: z.string().optional().describe("Collection restriction for ref types")
      })).describe("Array of predicates to create for the collection"),
      doc: z.string().optional().describe("Documentation for the collection")
    }
  },
  handler: async ({ collectionName, predicates, doc }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL}/fdb/${network || config.FLUREE_NETWORK}/${ledger || config.FLUREE_LEDGER}/transact`;
    
    try {
      const result = await createSchema(url, collectionName, predicates, doc);
      return {
        content: [
          {
            type: "text",
            text: `Schema Creation Result:\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Schema Creation Error: ${error.message}`
          }
        ]
      };
    }
  }
};

async function createSchema(url, collectionName, predicates, doc) {
  // Create collection transaction
  const collectionTx = {
    "_id": "_collection",
    "name": collectionName,
    "doc": doc || `Collection for ${collectionName}`
  };

  // Create predicate transactions
  const predicateTxs = predicates.map(pred => {
    const predTx = {
      "_id": "_predicate",
      "name": `${collectionName}/${pred.name}`,
      "type": pred.type,
      "doc": pred.doc || `${pred.name} field for ${collectionName}`
    };

    if (pred.unique) predTx.unique = true;
    if (pred.multi) predTx.multi = true;
    if (pred.index) predTx.index = true;
    if (pred.restrictCollection && pred.type === "ref") {
      predTx.restrictCollection = pred.restrictCollection;
    }

    return predTx;
  });

  const transaction = [collectionTx, ...predicateTxs];

  const options = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  };

  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to create schema: ${JSON.stringify(result)}`);
  }

  return {
    success: true,
    collection: collectionName,
    predicatesCreated: predicates.length,
    transactionId: result.tempids || result.tx_id,
    data: result
  };
}
