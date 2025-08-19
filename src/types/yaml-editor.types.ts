export interface YAMLMetadata {
  anchor?: string;
  referenceOf?: string;
}

export interface AnchorInfo {
  name: string;
  path: string;
  data: Record<string, any>;
}

export interface ReferenceInfo {
  path: string;
  anchor: string;
  data: Record<string, any>;
}

export interface NodePath {
  path: string;
  key: string;
  depth: number;
}

export type TabType = 'tree' | 'yaml' | 'scope';

export interface EditModalState {
  path: string | null;
  type: 'reference' | 'anchor' | null;
  anchorName?: string;
}
