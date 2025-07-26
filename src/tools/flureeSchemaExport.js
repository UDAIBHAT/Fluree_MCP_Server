import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeSchemaExport",
  config: {
    title: "Fluree Schema Export Tool",
    description: "Exports Fluree database schema definitions to JSON format. Can export specific collections or entire database schema.",
    inputSchema: {
      collectionName: z.string().optional().describe("Specific collection to export (if not provided, exports all collections)"),
      format: z.enum(["json", "edn", "compact"]).default("json").describe("Export format: detailed JSON, EDN, or compact JSON"),
      includeData: z.boolean().default(false).describe("Include sample data with schema export"),
      sampleSize: z.number().min(1).max(100).default(5).describe("Number of sample records per collection (if includeData is true)")
    }
  },
  handler: async ({ collectionName, format = "json", includeData = false, sampleSize = 5 }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const queryUrl = `${dbUrl || config.FLUREE_DB_URL}/fdb/${network || config.FLUREE_NETWORK}/${ledger || config.FLUREE_LEDGER}/query`;
    
    try {
      const result = await exportSchema(queryUrl, collectionName, format, includeData, sampleSize);
      return {
        content: [
          {
            type: "text",
            text: `Schema Export Result:\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Schema Export Error: ${error.message}`
          }
        ]
      };
    }
  }
};

async function exportSchema(queryUrl, collectionName, format, includeData, sampleSize) {
  const exportResult = {
    metadata: {
      exportDate: new Date().toISOString(),
      format: format,
      includeData: includeData,
      collectionFilter: collectionName || "all"
    },
    schema: {
      collections: [],
      predicates: []
    }
  };

  // Get collections to export
  const collectionsToExport = collectionName 
    ? [collectionName] 
    : await getCollections(queryUrl);

  // Export collections
  for (const collection of collectionsToExport) {
    const collectionData = await getCollectionDetails(queryUrl, collection);
    const predicates = await getPredicatesForCollection(queryUrl, collection);
    
    // Debug logging
    // console.log(`Debug: Collection ${collection} - found ${predicates.length} predicates`);
    if (predicates.length === 0) {
   //   console.log(`Debug: No predicates found for collection ${collection}. This could mean:`);
   //   console.log(`  1. Collection has no predicates defined`);
   //   console.log(`  2. Predicates are named differently`);
   //   console.log(`  3. Database connection issue`);
    }
    
    const collectionExport = {
      name: collection,
      doc: collectionData.doc || "",
      predicates: predicates
    };

    // Include sample data if requested
    if (includeData) {
      const sampleData = await getSampleData(queryUrl, collection, sampleSize);
      collectionExport.sampleData = sampleData;
    }

    exportResult.schema.collections.push(collectionExport);
  }

  // Get all predicates for the exported collections
  const allPredicates = await getAllPredicates(queryUrl, collectionsToExport);
  exportResult.schema.predicates = allPredicates;

  // Format according to requested format
  switch (format) {
    case "compact":
      return createCompactFormat(exportResult);
    case "edn":
      return createEdnFormat(exportResult);
    default:
      return exportResult;
  }
}

async function getCollections(queryUrl) {
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
  return result.map(item => item.name || item);
}

async function getCollectionDetails(queryUrl, collection) {
  const query = {
    select: ["name", "doc"],
    from: "_collection",
    where: [["name", collection]]
  };

  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const result = await response.json();
  return result[0] || { name: collection };
}

async function getPredicatesForCollection(queryUrl, collection) {
//  console.log(`Debug: Getting predicates for collection: ${collection}`);
  
  // Get ALL predicates and filter in JavaScript (more reliable)
  const query = {
    select: ["name", "type", "unique", "multi", "index", "restrictCollection", "doc"],
    from: "_predicate"
  };

  try {
    const response = await fetch(queryUrl, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    const allPredicates = await response.json();
   // console.log(`Debug: Retrieved ${Array.isArray(allPredicates) ? allPredicates.length : 'non-array'} total predicates`);
    
    if (!Array.isArray(allPredicates)) {
     // console.log(`Debug: Predicates query returned non-array:`, allPredicates);
      return [];
    }

    // Filter predicates for this collection in JavaScript
    const collectionPredicates = allPredicates.filter(predicate => {
      return predicate.name && predicate.name.startsWith(`${collection}/`);
    });
    
    //console.log(`Debug: Found ${collectionPredicates.length} predicates for collection ${collection}:`);
    collectionPredicates.forEach(pred => {
     // console.log(`  - ${pred.name} (${pred.type})`);
    });
    
    return collectionPredicates;
    
  } catch (error) {
    console.error(`Debug: Error getting predicates for collection ${collection}:`, error.message);
    return [];
  }
}

async function getAllPredicates(queryUrl, collections) {
  const allPredicates = [];
  
  for (const collection of collections) {
    const predicates = await getPredicatesForCollection(queryUrl, collection);
    // Ensure predicates is an array before spreading
    if (Array.isArray(predicates)) {
      allPredicates.push(...predicates);
    } else {
      console.warn(`Warning: getPredicatesForCollection returned non-array for collection ${collection}:`, predicates);
      // If it's a single object, wrap it in an array
      if (predicates && typeof predicates === 'object') {
        allPredicates.push(predicates);
      }
    }
  }
  
  return allPredicates;
}

async function getSampleData(queryUrl, collection, sampleSize) {
  const query = {
    select: ["*"],
    from: collection,
    limit: sampleSize
  };

  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  return await response.json();
}

function createCompactFormat(exportResult) {
  const compact = {
    collections: {},
    predicates: {}
  };

  exportResult.schema.collections.forEach(collection => {
    compact.collections[collection.name] = {
      doc: collection.doc,
      predicates: collection.predicates.map(p => p.name.split('/')[1])
    };
  });

  exportResult.schema.predicates.forEach(predicate => {
    const [collection, name] = predicate.name.split('/');
    if (!compact.predicates[collection]) {
      compact.predicates[collection] = {};
    }
    compact.predicates[collection][name] = {
      type: predicate.type,
      ...(predicate.unique && { unique: true }),
      ...(predicate.multi && { multi: true }),
      ...(predicate.index && { index: true }),
      ...(predicate.restrictCollection && { restrictCollection: predicate.restrictCollection }),
      ...(predicate.doc && { doc: predicate.doc })
    };
  });

  return {
    ...exportResult.metadata,
    schema: compact
  };
}

function createEdnFormat(exportResult) {
  // Convert to EDN-like format (simplified)
  const ednSchema = exportResult.schema.collections.map(collection => {
    return {
      collection: collection.name,
      predicates: collection.predicates.map(pred => ({
        name: pred.name,
        type: pred.type,
        properties: {
          ...(pred.unique && { unique: pred.unique }),
          ...(pred.multi && { multi: pred.multi }),
          ...(pred.index && { index: pred.index }),
          ...(pred.restrictCollection && { restrictCollection: pred.restrictCollection }),
          ...(pred.doc && { doc: pred.doc })
        }
      }))
    };
  });

  return {
    ...exportResult.metadata,
    format: "edn",
    schema: ednSchema
  };
}
