import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Copy, Check, Eye, EyeOff } from 'lucide-react';
import VisualEditorElement from './VisualEditor';
import { createAnchor } from '../utils/yaml-utils';
import { useDataContext } from '../context/DataContext';

const UIYamlEditor: React.FC = () => {
  const {
    data: formData,
    setData: setFormData,
    anchors,
    mocksAnchors,
    allAnchors,
    references,
    loadFromFile,
    exportYaml,
  } = useDataContext();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [yamlOutput, setYamlOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  // Initialize expanded nodes when data changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      const defaultExpanded = new Set([
        'root',
        'defaults',
        'users',
        'environments',
        'defaults.user_profile',
        'defaults.database_connection',
      ]);
      setExpandedNodes(defaultExpanded);
    }
  }, [formData]);

  const toggleNode = useCallback((path: string) => {
    setExpandedNodes((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  }, []);

  const updateData = useCallback(
    (path: string, updates: Record<string, unknown>) => {
      setFormData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const pathParts = path.split('.');
        let current = newData;

        // Navigate to the target object
        for (let i = 0; i < pathParts.length - 1; i++) {
          const key = pathParts[i];
          if (key.includes('[') && key.includes(']')) {
            const arrayKey = key.split('[')[0];
            const index = parseInt(key.split('[')[1].split(']')[0]);
            current = current[arrayKey][index];
          } else {
            current = current[key];
          }
        }

        // Apply the update
        const lastKey = pathParts[pathParts.length - 1];
        if (lastKey.includes('[') && lastKey.includes(']')) {
          const arrayKey = lastKey.split('[')[0];
          const index = parseInt(lastKey.split('[')[1].split(']')[0]);
          Object.assign(current[arrayKey][index], updates);
        } else {
          Object.assign(current[lastKey], updates);
        }

        return newData;
      });
    },
    [setFormData]
  );

  const addItem = useCallback(
    (path: string, itemType: string) => {
      setFormData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const pathParts = path.split('.');
        let current = newData;

        for (const key of pathParts) {
          current = current[key];
        }

        const newItem =
          itemType === 'user'
            ? {
                role: 'guest',
                timezone: 'UTC',
                username: `user${current.length + 1}`,
                notifications: { email: true, sms: false, push: false },
              }
            : {};

        current.push(newItem);
        return newData;
      });
    },
    [setFormData]
  );

  const deleteItem = useCallback(
    (path: string) => {
      setFormData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const pathParts = path.split('.');

        if (pathParts.length === 1) {
          delete newData[pathParts[0]];
        } else {
          let current = newData;
          for (let i = 0; i < pathParts.length - 1; i++) {
            const key = pathParts[i];
            if (key.includes('[') && key.includes(']')) {
              const arrayKey = key.split('[')[0];
              const index = parseInt(key.split('[')[1].split(']')[0]);
              current = current[arrayKey][index];
            } else {
              current = current[key];
            }
          }

          const lastKey = pathParts[pathParts.length - 1];
          if (lastKey.includes('[') && lastKey.includes(']')) {
            const arrayKey = lastKey.split('[')[0];
            const index = parseInt(lastKey.split('[')[1].split(']')[0]);
            current[arrayKey].splice(index, 1);
          } else {
            delete current[lastKey];
          }
        }

        return newData;
      });
    },
    [setFormData]
  );

  const handleCreateAnchor = useCallback(
    (path: string, anchorName: string) => {
      const newData = createAnchor(formData, path, anchorName);
      setFormData(newData);
    },
    [formData, setFormData]
  );

  const handleSetReference = useCallback(
    (path: string, anchorName: string) => {
      // Simple reference setting - just add the referenceOf property
      const newData = JSON.parse(JSON.stringify(formData));
      const pathParts = path.split(/[.[\]]+/).filter(Boolean);

      let current = newData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        current = !isNaN(Number(part)) ? current[parseInt(part)] : current[part];
      }

      const finalKey = pathParts[pathParts.length - 1];
      const targetNode = !isNaN(Number(finalKey)) ? current[parseInt(finalKey)] : current[finalKey];

      if (targetNode && typeof targetNode === 'object') {
        (targetNode as Record<string, unknown>).referenceOf = anchorName;
      }

      setFormData(newData);
    },
    [formData, setFormData]
  );

  const handleRemoveReference = useCallback(
    (path: string) => {
      setFormData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const pathParts = path.split('.');
        let current = newData;

        for (let i = 0; i < pathParts.length - 1; i++) {
          const key = pathParts[i];
          if (key.includes('[') && key.includes(']')) {
            const arrayKey = key.split('[')[0];
            const index = parseInt(key.split('[')[1].split(']')[0]);
            current = current[arrayKey][index];
          } else {
            current = current[key];
          }
        }

        const lastKey = pathParts[pathParts.length - 1];
        if (lastKey.includes('[') && lastKey.includes(']')) {
          const arrayKey = lastKey.split('[')[0];
          const index = parseInt(lastKey.split('[')[1].split(']')[0]);
          delete current[arrayKey][index].referenceOf;
        } else {
          delete current[lastKey].referenceOf;
        }

        return newData;
      });
    },
    [setFormData]
  );

  const handleEditAnchor = useCallback(
    (path: string, oldAnchorName: string, newAnchorName: string) => {
      setFormData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));

        // Update the anchor name at the specified path
        const pathParts = path.split('.');
        let current = newData;

        for (let i = 0; i < pathParts.length - 1; i++) {
          const key = pathParts[i];
          if (key.includes('[') && key.includes(']')) {
            const arrayKey = key.split('[')[0];
            const index = parseInt(key.split('[')[1].split(']')[0]);
            current = current[arrayKey][index];
          } else {
            current = current[key];
          }
        }

        const lastKey = pathParts[pathParts.length - 1];
        if (lastKey.includes('[') && lastKey.includes(']')) {
          const arrayKey = lastKey.split('[')[0];
          const index = parseInt(lastKey.split('[')[1].split(']')[0]);
          current[arrayKey][index].anchor = newAnchorName;
        } else {
          current[lastKey].anchor = newAnchorName;
        }

        // Update all references to use the new anchor name
        const updateReferences = (obj: unknown): unknown => {
          if (Array.isArray(obj)) {
            return obj.map(updateReferences);
          } else if (obj && typeof obj === 'object') {
            const newObj = { ...obj };
            if (newObj.referenceOf === oldAnchorName) {
              newObj.referenceOf = newAnchorName;
            }
            Object.keys(newObj).forEach((key) => {
              if (key !== 'anchor' && key !== 'referenceOf') {
                newObj[key] = updateReferences(newObj[key]);
              }
            });
            return newObj;
          }
          return obj;
        };

        return updateReferences(newData);
      });
    },
    [setFormData]
  );

  const handleRemoveAnchor = useCallback(
    (path: string) => {
      setFormData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const pathParts = path.split('.');
        let current = newData;

        for (let i = 0; i < pathParts.length - 1; i++) {
          const key = pathParts[i];
          if (key.includes('[') && key.includes(']')) {
            const arrayKey = key.split('[')[0];
            const index = parseInt(key.split('[')[1].split(']')[0]);
            current = current[arrayKey][index];
          } else {
            current = current[key];
          }
        }

        const lastKey = pathParts[pathParts.length - 1];
        if (lastKey.includes('[') && lastKey.includes(']')) {
          const arrayKey = lastKey.split('[')[0];
          const index = parseInt(lastKey.split('[')[1].split(']')[0]);
          delete current[arrayKey][index].anchor;
        } else {
          delete current[lastKey].anchor;
        }

        return newData;
      });
    },
    [setFormData]
  );

  // Generate YAML output
  useEffect(() => {
    const yamlContent = exportYaml();
    setYamlOutput(yamlContent);
  }, [formData, exportYaml]);

  const renderValue = useCallback(
    (value: unknown, key: string, path: string): React.ReactNode => {
      return (
        <VisualEditorElement
          key={path}
          elementKey={key}
          value={value}
          path={path}
          depth={0}
          isExpanded={expandedNodes.has(path)}
          onToggleExpanded={toggleNode}
          onUpdateData={updateData}
          onAddItem={addItem}
          onDeleteItem={deleteItem}
          onCreateAnchor={handleCreateAnchor}
          onSetReference={handleSetReference}
          onRemoveReference={handleRemoveReference}
          onEditAnchor={handleEditAnchor}
          onRemoveAnchor={handleRemoveAnchor}
          anchors={allAnchors}
          mocksAnchors={mocksAnchors}
          references={references}
          showMetadata={showMetadata}
        />
      );
    },
    [
      expandedNodes,
      showMetadata,
      allAnchors,
      mocksAnchors,
      references,
      toggleNode,
      updateData,
      addItem,
      deleteItem,
      handleCreateAnchor,
      handleSetReference,
      handleRemoveReference,
      handleEditAnchor,
      handleRemoveAnchor,
    ]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadYamlFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await loadFromFile(file);

      // Set initial expanded nodes based on data structure
      const newExpanded = new Set(['root']);
      Object.keys(formData).forEach((key) => {
        newExpanded.add(key);
        if (typeof formData[key] === 'object' && formData[key] !== null) {
          Object.keys(formData[key]).forEach((subKey) => {
            newExpanded.add(`${key}.${subKey}`);
          });
        }
      });
      setExpandedNodes(newExpanded);
    } catch (error) {
      // Error handled by context
      console.error('Error loading file:', error);
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-full max-w-7xl mx-auto px-4 py-6">
        <div className="card bg-white rounded-lg shadow-sm border h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">UI YAML Editor</h2>
              <p className="text-sm text-gray-600 mt-1">
                Visual YAML configuration editor with anchors and references
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                  showMetadata
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showMetadata ? <Eye size={16} /> : <EyeOff size={16} />}
                {showMetadata ? 'Hide' : 'Show'} Metadata
              </button>

              <input
                type="file"
                accept=".yaml,.yml,.json"
                onChange={loadYamlFile}
                className="hidden"
                id="yaml-file-input"
              />

              <label
                htmlFor="yaml-file-input"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors"
              >
                <Upload size={16} />
                Load YAML/JSON
              </label>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy YAML'}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="space-y-4 overflow-y-auto h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Visual YAML Configuration Editor
                </h3>
                <div className="text-sm text-gray-600">
                  {Object.keys(anchors).length} anchors • {references.length} references
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(formData).map(([key, value]) => renderValue(value, key, key))}

                {Object.keys(formData).length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Loaded</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Load a YAML or JSON file to start editing, or the component will use sample
                      data.
                    </p>
                    <p className="text-sm text-gray-500">Sample data is loaded by default</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIYamlEditor;
