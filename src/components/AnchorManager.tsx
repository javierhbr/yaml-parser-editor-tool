import React from 'react';
import { Anchor, Link } from 'lucide-react';
import type { AnchorInfo, ReferenceInfo } from '../types/yaml-editor.types';

interface AnchorManagerProps {
  anchors: Record<string, AnchorInfo>;
  references: ReferenceInfo[];
}

const AnchorManager: React.FC<AnchorManagerProps> = ({ anchors, references }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Anchor Manager</h3>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Defined Anchors</h4>
        <div className="space-y-2">
          {Object.entries(anchors).map(([name, info]) => (
            <div key={name} className="p-2 bg-blue-50 rounded border">
              <div className="flex items-center gap-2">
                <Anchor size={14} className="text-blue-600" />
                <code className="text-sm font-mono text-blue-800">{name}</code>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {info.path}
              </div>
            </div>
          ))}
          {Object.keys(anchors).length === 0 && (
            <p className="text-sm text-gray-500">No anchors defined</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Active References</h4>
        <div className="space-y-2">
          {references.map((ref, index) => (
            <div key={index} className="p-2 bg-green-50 rounded border">
              <div className="flex items-center gap-2">
                <Link size={14} className="text-green-600" />
                <code className="text-sm font-mono text-green-800">{ref.anchor}</code>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {ref.path}
              </div>
            </div>
          ))}
          {references.length === 0 && (
            <p className="text-sm text-gray-500">No references found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnchorManager;