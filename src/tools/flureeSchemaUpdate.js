import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeSchemaUpdate",
  config: {
    title: "Fluree Schema Update Tool",
    description: "Updates existing collections and predicates in Fluree database. Can modify documentation, add new predicates, or update predicate properties.",
    inputSchema: {
      collectionName: z.string().min(1).describe("Name of the existing collection to update"),
      updateType: z.enum(["collection", "predicates", "both"]).describe("What to update: collection metadata, predicates, or both"),
      collectionDoc: z.string().optional().describe("New documentation for the collection"),
      newPredicates: z.array(z.object({
        name: z.string().min(1).describe("Predicate name"),
        type: z.enum(["string", "int", "long", "float", "double", "boolean", "instant", "uuid", "uri", "bytes", "ref"]).describe("Data type"),
        doc: z.string().optional().describe("Documentation for the predicate"),
        unique: z.boolean().optional().default(false).describe("Whether the predicate should be unique"),
        multi: z.boolean().optional().default(false).describe("Whether the predicate can have multiple values"),
        index: z.boolean().optional().default(false).describe("Whether to create an index"),
        restrictCollection: z.string().optional().describe("Collection restriction for ref types")
      })).optional().describe("New predicates to add to the collection"),
      updatePredicates: z.array(z.object({
        name: z.string().min(1).describe("Existing predicate name (without collection prefix)"),
        doc: z.string().optional().describe("New documentation for the predicate"),
        index: z.boolean().optional().describe("Update index setting")
      })).optional().describe("Existing predicates to update")
    }
  },
  handler: async ({ collectionName, updateType, collectionDoc, newPredicates = [], updatePredicates = [] }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const url = `${dbUrl || config.FLUREE_DB_URL}/fdb/${network || config.FLUREE_NETWORK}/${ledger || config.FLUREE_LEDGER}/transact`;
    
    try {
      const result = await updateSchema(url, collectionName, updateType, collectionDoc, newPredicates, updatePredicates);
      return {
        content: [
          {
            type: "text",
            text: `Schema Update Result:\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Schema Update Error: ${error.message}`
          }
        ]
      };
    }
  }
};

async function updateSchema(url, collectionName, updateType, collectionDoc, newPredicates, updatePredicates) {
  const transaction = [];

  // Update collection if requested
  if ((updateType === "collection" || updateType === "both") && collectionDoc) {
    transaction.push({
      "_id": ["_collection/name", collectionName],
      "doc": collectionDoc
    });
  }

  // Add new predicates if provided
  if ((updateType === "predicates" || updateType === "both") && newPredicates.length > 0) {
    const newPredTxs = newPredicates.map(pred => {
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
    transaction.push(...newPredTxs);
  }

  // Update existing predicates if provided
  if ((updateType === "predicates" || updateType === "both") && updatePredicates.length > 0) {
    const updatePredTxs = updatePredicates.map(pred => {
      const predTx = {
        "_id": ["_predicate/name", `${collectionName}/${pred.name}`]
      };

      if (pred.doc !== undefined) predTx.doc = pred.doc;
      if (pred.index !== undefined) predTx.index = pred.index;

      return predTx;
    });
    transaction.push(...updatePredTxs);
  }

  if (transaction.length === 0) {
    throw new Error("No updates specified. Please provide collection documentation, new predicates, or predicate updates.");
  }

  const options = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  };

  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to update schema: ${JSON.stringify(result)}`);
  }

  return {
    success: true,
    collection: collectionName,
    updateType: updateType,
    newPredicatesAdded: newPredicates.length,
    predicatesUpdated: updatePredicates.length,
    transactionId: result.tempids || result.tx_id,
    data: result
  };
}
