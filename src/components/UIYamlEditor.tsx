import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Upload, Download, Copy, Check, FileText, Eye, EyeOff } from 'lucide-react';
import VisualEditorElement from './VisualEditor';
import {
  findAnchors,
  findReferences,
  updateReference,
  createAnchor,
  generateYamlFromJsonWithMetadata,
  parseYamlString,
} from '../utils/yaml-utils';
import schemaData from '../custom-yaml-parser/schema-sample-yaml.json';

interface JSONSchema {
  type: string;
  properties?: { [key: string]: JSONSchema };
  items?: JSONSchema;
  enum?: string[];
  $ref?: string;
  allOf?: JSONSchema[];
  required?: string[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  definitions?: { [key: string]: JSONSchema };
  title?: string;
}

interface FormData {
  [key: string]: any;
}

const UIYamlEditor: React.FC = () => {
  const [schema] = useState<JSONSchema>(schemaData as JSONSchema);
  const [formData, setFormData] = useState<FormData>({});
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [yamlOutput, setYamlOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  // Get default sample data based on schema structure
  const getDefaultData = (): FormData => {
    return {
      defaults: {
        user_profile: {
          role: 'guest',
          timezone: 'UTC',
          notifications: {
            email: true,
            sms: false,
            push: false,
          },
          anchor: 'default-user',
        },
        database_connection: {
          adapter: 'postgresql',
          host: 'localhost',
          port: 5432,
          pool: 5,
          anchor: 'default-db',
        },
      },
      users: [
        {
          role: 'guest',
          timezone: 'UTC',
          notifications: {
            email: true,
            sms: false,
            push: false,
          },
          referenceOf: 'default-user',
          username: 'charlie',
        },
        {
          role: 'admin',
          timezone: 'UTC',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
          referenceOf: 'default-user',
          username: 'diane',
          department: 'Engineering',
        },
      ],
      environments: {
        development: {
          database: {
            adapter: 'postgresql',
            host: 'localhost',
            port: 5432,
            pool: 5,
            referenceOf: 'default-db',
            database_name: 'myapp_dev',
          },
        },
        production: {
          database: {
            adapter: 'postgresql',
            host: 'prod.database.server.com',
            port: 5432,
            pool: 5,
            referenceOf: 'default-db',
            user: 'prod_user',
            database_name: 'myapp_prod',
          },
        },
      },
    };
  };

  const anchors = useMemo(() => findAnchors(formData), [formData]);
  const references = useMemo(() => findReferences(formData), [formData]);

  // Initialize form data with default sample data
  useEffect(() => {
    const initialData = getDefaultData();
    setFormData(initialData);

    // Set initial expanded nodes
    const defaultExpanded = new Set([
      'root',
      'defaults',
      'users',
      'environments',
      'defaults.user_profile',
      'defaults.database_connection',
    ]);
    setExpandedNodes(defaultExpanded);
  }, []);

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

  const updateData = useCallback((path: string, updates: any) => {
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
  }, []);

  const addItem = useCallback((path: string, itemType: string) => {
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
  }, []);

  const deleteItem = useCallback((path: string) => {
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
  }, []);

  const handleCreateAnchor = useCallback(
    (path: string, anchorName: string) => {
      const newData = createAnchor(formData, path, anchorName);
      setFormData(newData);
    },
    [formData]
  );

  const handleSetReference = useCallback(
    (path: string, anchorName: string) => {
      const newData = updateReference(formData, path, anchorName, anchors);
      setFormData(newData);
    },
    [formData, anchors]
  );

  const handleRemoveReference = useCallback((path: string) => {
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
  }, []);

  // Generate YAML output
  useEffect(() => {
    try {
      const yamlContent = generateYamlFromJsonWithMetadata(formData);
      setYamlOutput(yamlContent);
    } catch (error) {
      console.error('Error generating YAML:', error);
      setYamlOutput('# Error generating YAML');
    }
  }, [formData]);

  const renderValue = useCallback(
    (value: any, key: string, path: string): React.ReactNode => {
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
          anchors={anchors}
          showMetadata={showMetadata}
        />
      );
    },
    [
      expandedNodes,
      showMetadata,
      toggleNode,
      updateData,
      addItem,
      deleteItem,
      handleCreateAnchor,
      handleSetReference,
      handleRemoveReference,
      anchors,
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
      const content = await file.text();
      let newData: any;

      if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        newData = parseYamlString(content);
      } else if (file.name.endsWith('.json')) {
        newData = JSON.parse(content);
      } else {
        alert('Please upload a YAML (.yaml, .yml) or JSON (.json) file');
        return;
      }

      setFormData(newData);

      // Set initial expanded nodes based on data structure
      const newExpanded = new Set(['root']);
      Object.keys(newData).forEach((key) => {
        newExpanded.add(key);
        if (typeof newData[key] === 'object' && newData[key] !== null) {
          Object.keys(newData[key]).forEach((subKey) => {
            newExpanded.add(`${key}.${subKey}`);
          });
        }
      });
      setExpandedNodes(newExpanded);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Error loading file. Please check the file format.');
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-full max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
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
                    <button
                      onClick={() => {
                        const initialData = getDefaultData();
                        setFormData(initialData);
                        setExpandedNodes(new Set(['root', 'defaults', 'users', 'environments']));
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Load Sample Data
                    </button>
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
