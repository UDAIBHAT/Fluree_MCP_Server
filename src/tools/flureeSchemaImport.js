import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeSchemaImport",
  config: {
    title: "Fluree Schema Import Tool",
    description: "Imports schema definitions into Fluree database from JSON or EDN format. Can create collections and predicates from exported schema files.",
    inputSchema: {
      schemaData: z.object({
        collections: z.array(z.object({
          name: z.string(),
          doc: z.string().optional(),
          predicates: z.array(z.object({
            name: z.string(),
            type: z.string(),
            unique: z.boolean().optional(),
            multi: z.boolean().optional(),
            index: z.boolean().optional(),
            restrictCollection: z.string().optional(),
            doc: z.string().optional()
          }))
        }))
      }).describe("Schema data to import (in exported JSON format)"),
      importMode: z.enum(["create", "update", "merge"]).default("create").describe("Import mode: create (fail if exists), update (overwrite), or merge (add missing)"),
      dryRun: z.boolean().default(false).describe("If true, validates import without making changes"),
      skipExisting: z.boolean().default(false).describe("Skip collections/predicates that already exist")
    }
  },
  handler: async ({ schemaData, importMode = "create", dryRun = false, skipExisting = false }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const transactUrl = `${dbUrl || config.FLUREE_DB_URL}/fdb/${network || config.FLUREE_NETWORK}/${ledger || config.FLUREE_LEDGER}/transact`;
    const queryUrl = `${dbUrl || config.FLUREE_DB_URL}/fdb/${network || config.FLUREE_NETWORK}/${ledger || config.FLUREE_LEDGER}/query`;
    
    try {
      const result = await importSchema(transactUrl, queryUrl, schemaData, importMode, dryRun, skipExisting);
      return {
        content: [
          {
            type: "text",
            text: `Schema Import Result:\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Schema Import Error: ${error.message}`
          }
        ]
      };
    }
  }
};

async function importSchema(transactUrl, queryUrl, schemaData, importMode, dryRun, skipExisting) {
  const importResult = {
    success: true,
    dryRun: dryRun,
    importMode: importMode,
    timestamp: new Date().toISOString(),
    collections: {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    },
    predicates: {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    },
    transactions: []
  };

  // Validate schema data
  if (!schemaData.collections || !Array.isArray(schemaData.collections)) {
    throw new Error("Invalid schema data: collections array is required");
  }

  // Get existing collections and predicates
  const existingCollections = await getExistingCollections(queryUrl);
  const existingPredicates = await getExistingPredicates(queryUrl);

  // Process each collection
  for (const collection of schemaData.collections) {
    try {
      await processCollection(
        transactUrl, 
        collection, 
        existingCollections, 
        existingPredicates, 
        importMode, 
        dryRun, 
        skipExisting, 
        importResult
      );
    } catch (error) {
      importResult.collections.errors.push({
        collection: collection.name,
        error: error.message
      });
      importResult.success = false;
    }
  }

  // Generate summary
  importResult.summary = {
    totalCollections: schemaData.collections.length,
    collectionsCreated: importResult.collections.created.length,
    collectionsUpdated: importResult.collections.updated.length,
    collectionsSkipped: importResult.collections.skipped.length,
    collectionsErrors: importResult.collections.errors.length,
    predicatesCreated: importResult.predicates.created.length,
    predicatesUpdated: importResult.predicates.updated.length,
    predicatesSkipped: importResult.predicates.skipped.length,
    predicatesErrors: importResult.predicates.errors.length,
    totalTransactions: importResult.transactions.length
  };

  return importResult;
}

async function getExistingCollections(queryUrl) {
  const query = {
    select: ["name"],
    from: "_collection"
  };

  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const result = await response.json();
  return new Set(result.map(item => item.name || item));
}

async function getExistingPredicates(queryUrl) {
  const query = {
    select: ["name"],
    from: "_predicate"
  };

  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const result = await response.json();
  return new Set(result.map(item => item.name || item));
}

async function processCollection(transactUrl, collection, existingCollections, existingPredicates, importMode, dryRun, skipExisting, importResult) {
  const collectionExists = existingCollections.has(collection.name);
  
  // Handle collection creation/update
  if (!collectionExists) {
    // Create new collection
    const collectionTx = {
      "_id": "_collection",
      "name": collection.name,
      "doc": collection.doc || `Imported collection: ${collection.name}`
    };

    if (!dryRun) {
      const txResult = await executeTransaction(transactUrl, [collectionTx]);
      importResult.transactions.push(txResult);
    }

    importResult.collections.created.push(collection.name);
  } else {
    // Collection exists
    if (skipExisting) {
      importResult.collections.skipped.push(collection.name);
    } else if (importMode === "update" || importMode === "merge") {
      // Update collection documentation if provided
      if (collection.doc) {
        const updateTx = {
          "_id": ["_collection/name", collection.name],
          "doc": collection.doc
        };

        if (!dryRun) {
          const txResult = await executeTransaction(transactUrl, [updateTx]);
          importResult.transactions.push(txResult);
        }

        importResult.collections.updated.push(collection.name);
      }
    } else {
      importResult.collections.skipped.push(collection.name);
    }
  }

  // Process predicates for this collection
  for (const predicate of collection.predicates) {
    await processPredicate(
      transactUrl, 
      collection.name, 
      predicate, 
      existingPredicates, 
      importMode, 
      dryRun, 
      skipExisting, 
      importResult
    );
  }
}

async function processPredicate(transactUrl, collectionName, predicate, existingPredicates, importMode, dryRun, skipExisting, importResult) {
  const predicateName = predicate.name.includes('/') ? predicate.name : `${collectionName}/${predicate.name}`;
  const predicateExists = existingPredicates.has(predicateName);

  if (!predicateExists) {
    // Create new predicate
    const predicateTx = {
      "_id": "_predicate",
      "name": predicateName,
      "type": predicate.type,
      "doc": predicate.doc || `Imported predicate: ${predicateName}`
    };

    if (predicate.unique) predicateTx.unique = true;
    if (predicate.multi) predicateTx.multi = true;
    if (predicate.index) predicateTx.index = true;
    if (predicate.restrictCollection && predicate.type === "ref") {
      predicateTx.restrictCollection = predicate.restrictCollection;
    }

    if (!dryRun) {
      const txResult = await executeTransaction(transactUrl, [predicateTx]);
      importResult.transactions.push(txResult);
    }

    importResult.predicates.created.push(predicateName);
  } else {
    // Predicate exists
    if (skipExisting) {
      importResult.predicates.skipped.push(predicateName);
    } else if (importMode === "update" || importMode === "merge") {
      // Update predicate documentation and modifiable properties
      const updateTx = {
        "_id": ["_predicate/name", predicateName]
      };

      let hasUpdates = false;
      if (predicate.doc) {
        updateTx.doc = predicate.doc;
        hasUpdates = true;
      }
      if (predicate.index !== undefined) {
        updateTx.index = predicate.index;
        hasUpdates = true;
      }

      if (hasUpdates) {
        if (!dryRun) {
          const txResult = await executeTransaction(transactUrl, [updateTx]);
          importResult.transactions.push(txResult);
        }
        importResult.predicates.updated.push(predicateName);
      } else {
        importResult.predicates.skipped.push(predicateName);
      }
    } else {
      importResult.predicates.skipped.push(predicateName);
    }
  }
}

async function executeTransaction(transactUrl, transaction) {
  const options = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  };

  const response = await fetch(transactUrl, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Transaction failed: ${JSON.stringify(result)}`);
  }

  return {
    transactionId: result.tempids || result.tx_id,
    timestamp: new Date().toISOString(),
    transaction: transaction
  };
}
