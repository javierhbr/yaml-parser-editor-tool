import React from 'react';
import { ChevronRight, ChevronDown, Anchor, Link, Plus, Edit3 } from 'lucide-react';

interface TreeNodeProps {
  value: unknown;
  nodeKey: string;
  path: string;
  depth: number;
  expandedNodes: Set<string>;
  showMetadata: boolean;
  onToggle: (path: string) => void;
  onEditReference: (path: string) => void;
  onCreateAnchor: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  value,
  nodeKey,
  path,
  depth,
  expandedNodes,
  showMetadata,
  onToggle,
  onEditReference,
  onCreateAnchor,
}) => {
  const isExpanded = expandedNodes.has(path);
  const renderChildValue = (
    childValue: unknown,
    childKey: string,
    childPath: string
  ): React.ReactNode => {
    if (typeof childValue === 'object' && childValue !== null) {
      return (
        <TreeNode
          key={childPath}
          value={childValue}
          nodeKey={childKey}
          path={childPath}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          showMetadata={showMetadata}
          onToggle={onToggle}
          onEditReference={onEditReference}
          onCreateAnchor={onCreateAnchor}
        />
      );
    } else {
      return (
        <div key={childPath} className="ml-4 py-1 px-2">
          <span className="text-gray-600">{childKey}:</span>{' '}
          <span className="text-gray-900 font-mono text-sm">
            {typeof childValue === 'string' ? `"${childValue}"` : String(childValue)}
          </span>
        </div>
      );
    }
  };
  if (typeof value === 'object' && value !== null) {
    const isArray = Array.isArray(value);
    const hasReference = value.referenceOf;
    const hasAnchor = value.anchor;

    return (
      <div key={path} className="ml-4">
        <div
          className="flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-50 rounded group"
          onClick={() => onToggle(path)}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}

          <span className="font-medium text-gray-700">
            {nodeKey}: {isArray ? `[${value.length}]` : '{}'}
          </span>

          {showMetadata && hasAnchor && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              <Anchor size={12} />
              {value.anchor}
            </span>
          )}

          {showMetadata && hasReference && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              <Link size={12} />
              {value.referenceOf}
            </span>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {hasReference && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditReference(path);
                }}
                className="p-1 text-gray-500 hover:text-blue-600"
                title="Change reference"
              >
                <Edit3 size={14} />
              </button>
            )}

            {!hasAnchor && !hasReference && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateAnchor(path);
                }}
                className="p-1 text-gray-500 hover:text-green-600"
                title="Create anchor"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="ml-4 border-l border-gray-200 pl-4">
            {isArray
              ? (value as unknown[]).map((item: unknown, index: number) =>
                  renderChildValue(item, `[${index}]`, `${path}[${index}]`)
                )
              : Object.entries(value as Record<string, unknown>)
                  .filter(([k]) => k !== 'anchor' && k !== 'referenceOf')
                  .map(([k, v]) => renderChildValue(v, k, `${path}.${k}`))}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div key={path} className="ml-4 py-1 px-2">
        <span className="text-gray-600">{nodeKey}:</span>{' '}
        <span className="text-gray-900 font-mono text-sm">
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }
};

export default TreeNode;
