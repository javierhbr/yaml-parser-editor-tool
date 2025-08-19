import React from 'react';
import { Anchor } from 'lucide-react';
import type { AnchorInfo } from '../types/yaml-editor.types';

interface EditReferenceModalProps {
  editingReference: string;
  anchors: Record<string, AnchorInfo>;
  onUpdate: (path: string, anchorName: string) => void;
  onClose: () => void;
}

const EditReferenceModal: React.FC<EditReferenceModalProps> = ({
  editingReference,
  anchors,
  onUpdate,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Change Reference</h3>
        <p className="text-sm text-gray-600 mb-4">
          Editing reference at: <code className="bg-gray-100 px-1 rounded">{editingReference}</code>
        </p>
        <div className="space-y-3">
          {Object.keys(anchors).map(anchorName => (
            <button
              key={anchorName}
              onClick={() => onUpdate(editingReference, anchorName)}
              className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Anchor size={14} className="text-blue-600" />
                <span className="font-mono text-sm">{anchorName}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {anchors[anchorName].path}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditReferenceModal;