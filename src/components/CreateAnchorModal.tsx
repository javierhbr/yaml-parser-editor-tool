import React, { useState } from 'react';

interface CreateAnchorModalProps {
  creatingAnchor: string;
  onCreate: (path: string, anchorName: string) => void;
  onClose: () => void;
}

const CreateAnchorModal: React.FC<CreateAnchorModalProps> = ({
  creatingAnchor,
  onCreate,
  onClose,
}) => {
  const [anchorName, setAnchorName] = useState('');

  const handleCreate = () => {
    if (anchorName.trim()) {
      onCreate(creatingAnchor, anchorName.trim());
      setAnchorName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Create New Anchor</h3>
        <p className="text-sm text-gray-600 mb-4">
          Creating anchor for: <code className="bg-gray-100 px-1 rounded">{creatingAnchor}</code>
        </p>
        <input
          type="text"
          value={anchorName}
          onChange={(e) => setAnchorName(e.target.value)}
          placeholder="Enter anchor name (e.g., my-anchor)"
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!anchorName.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAnchorModal;
