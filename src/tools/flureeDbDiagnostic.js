import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeDbDiagnostic",
  config: {
    title: "Fluree Database Diagnostic Tool",
    description: "Diagnoses the current state of the Fluree database by checking collections, predicates, and sample data. Useful for troubleshooting schema issues.",
    inputSchema: {
      checkType: z.enum(["all", "collections", "predicates", "data"]).default("all").describe("What to check: all, collections only, predicates only, or data samples"),
      includeSystemCollections: z.boolean().default(false).describe("Include system collections (_collection, _predicate, etc.)")
    }
  },
  handler: async ({ checkType = "all", includeSystemCollections = false }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const queryUrl = `${dbUrl || config.FLUREE_DB_URL}/fdb/${network || config.FLUREE_NETWORK}/${ledger || config.FLUREE_LEDGER}/query`;
    
    try {
      const result = await runDiagnostic(queryUrl, checkType, includeSystemCollections);
      return {
        content: [
          {
            type: "text",
            text: `Database Diagnostic Result:\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Database Diagnostic Error: ${error.message}`
          }
        ]
      };
    }
  }
};

async function runDiagnostic(queryUrl, checkType, includeSystemCollections) {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    checkType: checkType,
    database: {
      collections: [],
      predicates: [],
      sampleData: {}
    },
    summary: {},
    issues: []
  };

  try {
    // Check collections
    if (checkType === "all" || checkType === "collections") {
      diagnostic.database.collections = await getAllCollections(queryUrl, includeSystemCollections);
    }

    // Check predicates
    if (checkType === "all" || checkType === "predicates") {
      diagnostic.database.predicates = await getAllPredicatesDetailed(queryUrl, includeSystemCollections);
    }

    // Check sample data
    if (checkType === "all" || checkType === "data") {
      const userCollections = diagnostic.database.collections.filter(c => !c.name.startsWith('_'));
      for (const collection of userCollections.slice(0, 3)) { // Limit to first 3 collections
        diagnostic.database.sampleData[collection.name] = await getSampleDataForDiagnostic(queryUrl, collection.name);
      }
    }

    // Generate summary
    diagnostic.summary = {
      totalCollections: diagnostic.database.collections.length,
      userCollections: diagnostic.database.collections.filter(c => !c.name.startsWith('_')).length,
      systemCollections: diagnostic.database.collections.filter(c => c.name.startsWith('_')).length,
      totalPredicates: diagnostic.database.predicates.length,
      userPredicates: diagnostic.database.predicates.filter(p => !p.name.startsWith('_')).length,
      systemPredicates: diagnostic.database.predicates.filter(p => p.name.startsWith('_')).length
    };

    // Check for common issues
    if (diagnostic.summary.userCollections === 0) {
      diagnostic.issues.push("No user collections found - database might be empty");
    }
    
    if (diagnostic.summary.userPredicates === 0 && diagnostic.summary.userCollections > 0) {
      diagnostic.issues.push("Collections exist but no user predicates found - collections might not have schema defined");
    }

  } catch (error) {
    diagnostic.issues.push(`Diagnostic error: ${error.message}`);
  }

  return diagnostic;
}

async function getAllCollections(queryUrl, includeSystem) {
  const query = {
    select: ["name", "doc"],
    from: "_collection"
  };

  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const result = await response.json();
  
  if (!Array.isArray(result)) {
    throw new Error(`Expected array from collections query, got: ${JSON.stringify(result)}`);
  }

  return includeSystem ? result : result.filter(c => !c.name.startsWith('_'));
}

async function getAllPredicatesDetailed(queryUrl, includeSystem) {
  const query = {
    select: ["name", "type", "unique", "multi", "index", "restrictCollection", "doc"],
    from: "_predicate"
  };

  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const result = await response.json();
  
  if (!Array.isArray(result)) {
    throw new Error(`Expected array from predicates query, got: ${JSON.stringify(result)}`);
  }

  return includeSystem ? result : result.filter(p => !p.name.startsWith('_'));
}

async function getSampleDataForDiagnostic(queryUrl, collection) {
  const query = {
    select: ["*"],
    from: collection,
    limit: 3
  };

  try {
    const response = await fetch(queryUrl, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    const result = await response.json();
    
    return {
      recordCount: Array.isArray(result) ? result.length : 0,
      sample: Array.isArray(result) ? result.slice(0, 2) : result
    };
  } catch (error) {
    return {
      error: error.message,
      recordCount: 0
    };
  }
}
