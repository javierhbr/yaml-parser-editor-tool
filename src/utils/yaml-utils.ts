import { parseYamlString } from '../custom-yaml-parser/yaml-parser';
import { generateYamlFromJsonWithMetadata } from '../custom-yaml-parser/yaml-generator';
import type { AnchorInfo, ReferenceInfo } from '../types/yaml-editor.types';

export function findAnchors(obj: unknown, path: string = ''): Record<string, AnchorInfo> {
  const anchors: Record<string, AnchorInfo> = {};

  const traverse = (current: unknown, currentPath: string) => {
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as Record<string, unknown>;
      if (currentObj.anchor) {
        anchors[currentObj.anchor as string] = {
          name: currentObj.anchor as string,
          path: currentPath,
          data: { ...currentObj },
        };
        delete (anchors[currentObj.anchor as string].data as Record<string, unknown>).anchor;
      }

      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`);
        });
      } else {
        Object.entries(currentObj).forEach(([key, value]) => {
          traverse(value, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    }
  };

  traverse(obj, path);
  return anchors;
}

export function findReferences(obj: unknown, path: string = ''): ReferenceInfo[] {
  const references: ReferenceInfo[] = [];

  const traverse = (current: unknown, currentPath: string) => {
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as Record<string, unknown>;
      if (currentObj.referenceOf) {
        references.push({
          path: currentPath,
          anchor: currentObj.referenceOf as string,
          data: currentObj,
        });
      }

      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`);
        });
      } else {
        Object.entries(currentObj).forEach(([key, value]) => {
          traverse(value, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    }
  };

  traverse(obj, path);
  return references;
}

export function updateReference(
  data: unknown,
  path: string,
  newAnchor: string,
  anchors: Record<string, AnchorInfo>
): unknown {
  const newData = JSON.parse(JSON.stringify(data));
  const pathParts = path.split(/[.[\]]+/).filter(Boolean);

  let current = newData;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    current = !isNaN(Number(part)) ? current[parseInt(part)] : current[part];
  }

  const finalKey = pathParts[pathParts.length - 1];
  const targetNode = !isNaN(Number(finalKey)) ? current[parseInt(finalKey)] : current[finalKey];

  if (anchors[newAnchor]) {
    const anchorData = { ...anchors[newAnchor].data };

    Object.keys(targetNode).forEach((key) => {
      if (key !== 'referenceOf' && !Object.prototype.hasOwnProperty.call(anchorData, key)) {
        (anchorData as Record<string, unknown>)[key] = (targetNode as Record<string, unknown>)[key];
      }
    });

    (anchorData as Record<string, unknown>).referenceOf = newAnchor;

    if (!isNaN(Number(finalKey))) {
      current[parseInt(finalKey)] = anchorData;
    } else {
      current[finalKey] = anchorData;
    }
  }

  return newData;
}

export function createAnchor(data: unknown, path: string, anchorName: string): unknown {
  const newData = JSON.parse(JSON.stringify(data));
  const pathParts = path.split(/[.[\]]+/).filter(Boolean);

  let current = newData;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    current = !isNaN(Number(part)) ? current[parseInt(part)] : current[part];
  }

  const finalKey = pathParts[pathParts.length - 1];
  const targetNode = !isNaN(Number(finalKey)) ? current[parseInt(finalKey)] : current[finalKey];

  if (!newData.defaults) newData.defaults = {};
  newData.defaults[anchorName] = { ...targetNode, anchor: anchorName };
  delete (newData.defaults[anchorName] as Record<string, unknown>).referenceOf;

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
    references.forEach((ref) => {
      const pathDisplay = ref.path.includes('[')
        ? `${ref.path.split('[')[0]}[${ref.path.match(/\[(\d+)\]/)?.[1] || '?'}]`
        : ref.path;
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
