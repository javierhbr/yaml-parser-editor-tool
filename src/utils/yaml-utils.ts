import { parseYamlString } from '../custom-yaml-parser/yaml-parser';
import { generateYamlFromJsonWithMetadata } from '../custom-yaml-parser/yaml-generator';
import type { AnchorInfo, ReferenceInfo } from '../types/yaml-editor.types';

export function findAnchors(obj: any, path: string = ''): Record<string, AnchorInfo> {
  const anchors: Record<string, AnchorInfo> = {};
  
  const traverse = (current: any, currentPath: string) => {
    if (typeof current === 'object' && current !== null) {
      if (current.anchor) {
        anchors[current.anchor] = {
          name: current.anchor,
          path: currentPath,
          data: { ...current }
        };
        delete anchors[current.anchor].data.anchor;
      }
      
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`);
        });
      } else {
        Object.entries(current).forEach(([key, value]) => {
          traverse(value, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    }
  };
  
  traverse(obj, path);
  return anchors;
}

export function findReferences(obj: any, path: string = ''): ReferenceInfo[] {
  const references: ReferenceInfo[] = [];
  
  const traverse = (current: any, currentPath: string) => {
    if (typeof current === 'object' && current !== null) {
      if (current.referenceOf) {
        references.push({
          path: currentPath,
          anchor: current.referenceOf,
          data: current
        });
      }
      
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`);
        });
      } else {
        Object.entries(current).forEach(([key, value]) => {
          traverse(value, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    }
  };
  
  traverse(obj, path);
  return references;
}

export function updateReference(data: any, path: string, newAnchor: string, anchors: Record<string, AnchorInfo>): any {
  const newData = JSON.parse(JSON.stringify(data));
  const pathParts = path.split(/[\.\[\]]+/).filter(Boolean);
  
  let current = newData;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    current = !isNaN(Number(part)) ? current[parseInt(part)] : current[part];
  }
  
  const finalKey = pathParts[pathParts.length - 1];
  let targetNode = !isNaN(Number(finalKey)) ? current[parseInt(finalKey)] : current[finalKey];

  if (anchors[newAnchor]) {
    const anchorData = { ...anchors[newAnchor].data };
    
    Object.keys(targetNode).forEach(key => {
      if (key !== 'referenceOf' && !anchorData.hasOwnProperty(key)) {
        anchorData[key] = targetNode[key];
      }
    });
    
    anchorData.referenceOf = newAnchor;
    
    if (!isNaN(Number(finalKey))) {
      current[parseInt(finalKey)] = anchorData;
    } else {
      current[finalKey] = anchorData;
    }
  }

  return newData;
}

export function createAnchor(data: any, path: string, anchorName: string): any {
  const newData = JSON.parse(JSON.stringify(data));
  const pathParts = path.split(/[\.\[\]]+/).filter(Boolean);
  
  let current = newData;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    current = !isNaN(Number(part)) ? current[parseInt(part)] : current[part];
  }
  
  const finalKey = pathParts[pathParts.length - 1];
  let targetNode = !isNaN(Number(finalKey)) ? current[parseInt(finalKey)] : current[finalKey];

  if (!newData.defaults) newData.defaults = {};
  newData.defaults[anchorName] = { ...targetNode, anchor: anchorName };
  delete newData.defaults[anchorName].referenceOf;

  const referenceData = { ...targetNode, referenceOf: anchorName };
  if (!isNaN(Number(finalKey))) {
    current[parseInt(finalKey)] = referenceData;
  } else {
    current[finalKey] = referenceData;
  }

  return newData;
}

export function generateScopeDocument(
  anchors: Record<string, AnchorInfo>,
  references: ReferenceInfo[],
  fileName: string
): string {
  let doc = '# Anchor/Reference Scope Document\n\n';
  
  doc += '## Defined Anchors\n';
  if (Object.keys(anchors).length === 0) {
    doc += '- No anchors defined\n';
  } else {
    Object.entries(anchors).forEach(([name, info]) => {
      doc += `- \`${name}\` → \`/${info.path.replace(/\./g, '/')}\`\n`;
    });
  }
  
  doc += '\n## References\n';
  if (references.length === 0) {
    doc += '- No references found\n';
  } else {
    references.forEach(ref => {
      const pathDisplay = ref.path.includes('[') ? 
        `${ref.path.split('[')[0]}[${ref.path.match(/\[(\d+)\]/)?.[1] || '?'}]` : 
        ref.path;
      doc += `- \`${pathDisplay}\` → \`${ref.anchor}\`\n`;
    });
  }
  
  doc += '\n## Summary\n';
  doc += `- **Total Anchors**: ${Object.keys(anchors).length}\n`;
  doc += `- **Total References**: ${references.length}\n`;
  doc += `- **File**: ${fileName}\n`;
  doc += `- **Last Updated**: ${new Date().toLocaleString()}\n`;
  
  return doc;
}

export { parseYamlString, generateYamlFromJsonWithMetadata };