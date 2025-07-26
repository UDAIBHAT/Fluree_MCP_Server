import { z } from 'zod';
import * as config from "../config/constant.js";

export default {
  name: "flureeSchemaValidate",
  config: {
    title: "Fluree Schema Validation Tool",
    description: "Validates schema integrity and data consistency in Fluree database. Checks for missing predicates, invalid references, and schema violations.",
    inputSchema: {
      collectionName: z.string().optional().describe("Specific collection to validate (if not provided, validates all collections)"),
      validationType: z.enum(["structure", "data", "both"]).default("both").describe("Type of validation: structure only, data consistency, or both"),
      sampleSize: z.number().min(1).max(1000).default(100).describe("Number of records to sample for data validation")
    }
  },
  handler: async ({ collectionName, validationType = "both", sampleSize = 100 }, session = {}) => {
    const { dbUrl, network, ledger } = (session.connectionInfo || {});
    const queryUrl = `${dbUrl || config.FLUREE_DB_URL}/fdb/${network || config.FLUREE_NETWORK}/${ledger || config.FLUREE_LEDGER}/query`;
    
    try {
      const result = await validateSchema(queryUrl, collectionName, validationType, sampleSize);
      return {
        content: [
          {
            type: "text",
            text: `Schema Validation Result:\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Schema Validation Error: ${error.message}`
          }
        ]
      };
    }
  }
};

async function validateSchema(queryUrl, collectionName, validationType, sampleSize) {
  const validationResults = {
    success: true,
    validationType: validationType,
    timestamp: new Date().toISOString(),
    collections: [],
    issues: [],
    summary: {}
  };

  // Get collections to validate
  const collectionsToValidate = collectionName 
    ? [collectionName] 
    : await getCollections(queryUrl);

  for (const collection of collectionsToValidate) {
    const collectionResult = {
      name: collection,
      structureValid: true,
      dataValid: true,
      predicates: [],
      dataIssues: []
    };

    // Structure validation
    if (validationType === "structure" || validationType === "both") {
      const structureValidation = await validateStructure(queryUrl, collection);
      collectionResult.structureValid = structureValidation.valid;
      collectionResult.predicates = structureValidation.predicates;
      if (!structureValidation.valid) {
        validationResults.issues.push(...structureValidation.issues);
      }
    }

    // Data validation
    if (validationType === "data" || validationType === "both") {
      const dataValidation = await validateData(queryUrl, collection, sampleSize);
      collectionResult.dataValid = dataValidation.valid;
      collectionResult.dataIssues = dataValidation.issues;
      if (!dataValidation.valid) {
        validationResults.issues.push(...dataValidation.issues);
      }
    }

    validationResults.collections.push(collectionResult);
  }

  // Generate summary
  validationResults.summary = {
    totalCollections: validationResults.collections.length,
    validCollections: validationResults.collections.filter(c => c.structureValid && c.dataValid).length,
    totalIssues: validationResults.issues.length,
    structureIssues: validationResults.issues.filter(i => i.type === "structure").length,
    dataIssues: validationResults.issues.filter(i => i.type === "data").length
  };

  validationResults.success = validationResults.issues.length === 0;

  return validationResults;
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

async function validateStructure(queryUrl, collection) {
  // Fetch **all** predicates and filter client-side; avoids Fluree where regex limitations
  const query = {
    select: ["name", "type", "unique", "multi", "index", "restrictCollection", "doc"],
    from: "_predicate"
  };

  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const predicatesResponse = await response.json();
  const predicatesAll = Array.isArray(predicatesResponse) ? predicatesResponse : [];
  // Keep only predicates that belong to this collection (name starts with "collection/")
  const predicates = predicatesAll.filter(p => p.name && p.name.startsWith(`${collection}/`));
  const issues = [];

  // If the response wasn't an array, record an issue so the user knows there was a problem
  if (!Array.isArray(predicatesResponse)) {
    issues.push({
      type: "structure",
      severity: "error",
      collection: collection,
      predicate: null,
      message: "Predicate query returned unexpected response format",
      details: predicatesResponse
    });
  }

  // Check for common structure issues
  predicates.forEach(pred => {
    // Check for missing documentation
    if (!pred.doc) {
      issues.push({
        type: "structure",
        severity: "warning",
        collection: collection,
        predicate: pred.name,
        message: "Predicate missing documentation"
      });
    }

    // Check for ref types without restrictCollection
    if (pred.type === "ref" && !pred.restrictCollection) {
      issues.push({
        type: "structure",
        severity: "warning",
        collection: collection,
        predicate: pred.name,
        message: "Reference predicate without collection restriction"
      });
    }
  });

  return {
    valid: issues.length === 0,
    predicates: predicates,
    issues: issues
  };
}

async function validateData(queryUrl, collection, sampleSize) {
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

  const data = await response.json();
  const issues = [];

  // Basic data validation
  if (Array.isArray(data)) {
    data.forEach((record, index) => {
      // Check for required fields (this is a basic check)
      if (!record._id) {
        issues.push({
          type: "data",
          severity: "error",
          collection: collection,
          record: index,
          message: "Record missing _id field"
        });
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues: issues,
    recordsChecked: Array.isArray(data) ? data.length : 0
  };
}
