/**
 * This module parses YAML files and converts them into JSON objects.
 * It injects 'anchor' and 'referenceOf' properties into the JSON to show
 * where anchors were defined and referenced.
 */

import YAML, { Document } from 'yaml';

/**
 * Recursively traverses the YAML document's CST (Concrete Syntax Tree)
 * and builds a JavaScript object with anchor/reference metadata.
 * @param node The current CST node to process.
 * @param doc The YAML document for resolving aliases.
 * @returns A JavaScript object, array, or primitive value.
 */
export function buildJsonWithMetadata(node: any, doc: Document): any {
  const { Pair, Scalar, YAMLMap, YAMLSeq, Alias } = YAML;

  if (!node) {
    return null;
  }

  // Case 1: The node is a Scalar (string, number, boolean).
  if (node instanceof Scalar) {
    return node.value;
  }

  // Case 2: The node is a Map (object).
  if (node instanceof YAMLMap) {
    let result: { [key: string]: any } = {};

    // Check for merge keys (e.g., <<: *anchor).
    for (const item of node.items) {
      if (item instanceof Pair && item.key instanceof Scalar && item.key.value === '<<' && item.value instanceof Alias) {
        const alias = item.value;
        const anchorNode = alias.resolve(doc); // Find the original anchored node.
        if (!anchorNode) {
          throw new Error(`Undefined anchor reference: ${alias.source}`);
        }
        // Recursively build the JSON for the anchored content and merge it.
        let anchorJson = buildJsonWithMetadata(anchorNode, doc);
        // Remove the anchor property when merging
        if (anchorJson && typeof anchorJson === 'object' && 'anchor' in anchorJson) {
          anchorJson = { ...anchorJson };
          delete anchorJson.anchor;
        }
        Object.assign(result, anchorJson);
        // Add the 'referenceOf' attribute.
        result.referenceOf = alias.source;
      }
    }

    // Process the rest of the key-value pairs.
    for (const item of node.items) {
      if (item instanceof Pair && item.key instanceof Scalar && item.key.value !== '<<') {
        const key = item.key.value as string;
        result[key] = buildJsonWithMetadata(item.value, doc);
      }
    }

    // If the map itself is an anchor, add the 'anchor' attribute.
    if (node.anchor) {
      result.anchor = node.anchor;
    }

    return result;
  }

  // Case 3: The node is a Sequence (array).
  if (node instanceof YAMLSeq) {
    // Note: Anchors on sequences are less common but possible.
    // This implementation focuses on maps, which is the primary use case.
    return node.items.map((item: any) => buildJsonWithMetadata(item, doc));
  }

  // Handle ALIAS nodes that are not part of a merge key (less common).
  if (node instanceof Alias) {
      const anchorNode = node.resolve(doc);
      if (!anchorNode) {
        throw new Error(`Undefined anchor reference: ${node.source}`);
      }
      let anchorJson = buildJsonWithMetadata(anchorNode, doc);
      
      // If the resolved value is a primitive (string, number, boolean), 
      // return it directly with referenceOf metadata only if it's an object
      if (typeof anchorJson !== 'object' || anchorJson === null) {
        // For primitives, we might want to return just the value
        // But since we need to preserve referenceOf information, 
        // we'll create an object only if specifically requested
        return anchorJson;
      }
      
      // For objects, remove the anchor property from the direct alias reference
      if ('anchor' in anchorJson) {
        anchorJson = { ...anchorJson };
        delete anchorJson.anchor;
      }
      
      // For a direct alias to an object, add the referenceOf property
      return { ...anchorJson, referenceOf: node.source };
  }

  return node;
}

// Note: parseYamlFile is not available in browser environment
// Use parseYamlString instead

/**
 * Parses a YAML string and returns its JSON representation with metadata.
 * @param yamlContent YAML string to parse
 * @returns Parsed JSON object with anchor/reference metadata
 */
export function parseYamlString(yamlContent: string): any {
  // Parse the YAML into a document
  const doc = YAML.parseDocument(yamlContent);
  
  // Check for parsing errors
  if (doc.errors && doc.errors.length > 0) {
    throw new Error(`YAML parsing errors: ${doc.errors.map(e => e.message).join(', ')}`);
  }
  
  // Build and return the JSON with metadata
  let finalJson = {};
  if (doc.contents) {
    finalJson = buildJsonWithMetadata(doc.contents, doc);
  }
  
  return finalJson;
}

// Browser-compatible version - no file system operations
