import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, Download, FileText, Eye, EyeOff, Copy } from 'lucide-react';
import AnchorManager from './components/AnchorManager';
import TreeNode from './components/TreeNode';
import EditReferenceModal from './components/EditReferenceModal';
import CreateAnchorModal from './components/CreateAnchorModal';
import {
  findAnchors,
  findReferences,
  updateReference,
  createAnchor,
  generateScopeDocument,
  parseYamlString,
  generateYamlFromJsonWithMetadata
} from './utils/yaml-utils';
import type { TabType } from './types/yaml-editor.types';

const YAMLAnchorEditor: React.FC = () => {
  const [data, setData] = useState<any>({
    "defaults": {
      "user_profile": {
        "role": "guest",
        "timezone": "UTC",
        "notifications": {
          "email": true,
          "sms": false,
          "push": false
        },
        "anchor": "default-user"
      },
      "database_connection": {
        "adapter": "postgresql",
        "host": "localhost",
        "port": 5432,
        "pool": 5,
        "anchor": "default-db"
      }
    },
    "users": [
      {
        "role": "guest",
        "timezone": "UTC",
        "notifications": {
          "email": true,
          "sms": false,
          "push": false
        },
        "referenceOf": "default-user",
        "username": "charlie"
      },
      {
        "role": "admin",
        "timezone": "UTC",
        "notifications": {
          "email": true,
          "sms": true,
          "push": true
        },
        "referenceOf": "default-user",
        "username": "diane",
        "department": "Engineering"
      }
    ],
    "environments": {
      "development": {
        "database": {
          "adapter": "postgresql",
          "host": "localhost",
          "port": 5432,
          "pool": 5,
          "referenceOf": "default-db",
          "database_name": "myapp_dev"
        }
      },
      "production": {
        "database": {
          "adapter": "postgresql",
          "host": "prod.database.server.com",
          "port": 5432,
          "pool": 5,
          "referenceOf": "default-db",
          "user": "prod_user",
          "database_name": "myapp_prod"
        }
      }
    }
  });

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root', 'defaults', 'users', 'environments', 'defaults.user_profile', 'defaults.database_connection'])
  );
  const [editingReference, setEditingReference] = useState<string | null>(null);
  const [creatingAnchor, setCreatingAnchor] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState('sample.yaml');
  const [activeTab, setActiveTab] = useState<TabType>('tree');
  const [yamlOutput, setYamlOutput] = useState('');
  const [scopeDoc, setScopeDoc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const anchors = useMemo(() => findAnchors(data), [data]);
  const references = useMemo(() => findReferences(data), [data]);

  const toggleNode = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setUploadedFileName(file.name);
    setError(null);
    
    try {
      let jsonData: any;
      
      if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        jsonData = parseYamlString(text);
      } else if (file.name.endsWith('.json')) {
        jsonData = JSON.parse(text);
      } else {
        setError('Please upload a YAML (.yaml, .yml) or JSON (.json) file');
        return;
      }
      
      setData(jsonData);
      
      const newExpanded = new Set(['root']);
      Object.keys(jsonData).forEach(key => {
        newExpanded.add(key);
      });
      setExpandedNodes(newExpanded);
      
      setEditingReference(null);
      setCreatingAnchor(null);
      setActiveTab('tree');
      setYamlOutput('');
      setScopeDoc('');
      
    } catch (err) {
      setError(`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const exportToYAML = () => {
    try {
      const yamlContent = generateYamlFromJsonWithMetadata(data);
      setYamlOutput(yamlContent);
      
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadedFileName.replace(/\.(json|yaml|yml)$/, '_edited.yaml');
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Error generating YAML: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const handleUpdateReference = (path: string, newAnchor: string) => {
    const newData = updateReference(data, path, newAnchor, anchors);
    setData(newData);
    setEditingReference(null);
  };

  const handleCreateAnchor = (path: string, anchorName: string) => {
    const newData = createAnchor(data, path, anchorName);
    setData(newData);
    setCreatingAnchor(null);
  };

  const renderValue = useCallback((value: any, key: string, path: string, depth: number = 0): React.ReactNode => {
    return (
      <TreeNode
        key={path}
        value={value}
        nodeKey={key}
        path={path}
        depth={depth}
        expandedNodes={expandedNodes}
        showMetadata={showMetadata}
        onToggle={toggleNode}
        onEditReference={setEditingReference}
        onCreateAnchor={setCreatingAnchor}
      />
    );
  }, [expandedNodes, showMetadata, toggleNode]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">YAML Anchor & Reference Editor</h1>
              <p className="text-gray-600 mt-1">Visualize and manage YAML anchors (&) and references (*)</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  showMetadata 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showMetadata ? <Eye size={16} /> : <EyeOff size={16} />}
                {showMetadata ? 'Hide' : 'Show'} Metadata
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Upload size={16} />
                Upload File
              </button>
              
              <button
                onClick={exportToYAML}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                Export YAML
              </button>
            </div>
          </div>
          
          {/* File info */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <FileText size={14} />
              {uploadedFileName}
            </span>
            <span>{Object.keys(anchors).length} anchors</span>
            <span>{references.length} references</span>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AnchorManager anchors={anchors} references={references} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {[
                    { id: 'tree' as TabType, label: 'Tree View', icon: FileText },
                    { id: 'yaml' as TabType, label: 'YAML Output', icon: Download },
                    { id: 'scope' as TabType, label: 'Scope Document', icon: FileText }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id === 'yaml') {
                          setYamlOutput(generateYamlFromJsonWithMetadata(data));
                        } else if (tab.id === 'scope') {
                          setScopeDoc(generateScopeDocument(anchors, references, uploadedFileName));
                        }
                      }}
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'tree' && (
                  <div className="max-h-96 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Structure</h3>
                    {Object.entries(data).map(([key, value]) => 
                      renderValue(value, key, key, 0)
                    )}
                  </div>
                )}

                {activeTab === 'yaml' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Generated YAML</h3>
                      <button
                        onClick={() => copyToClipboard(yamlOutput)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto border">
                      {yamlOutput || 'Click "Generate YAML" to see output'}
                    </pre>
                  </div>
                )}

                {activeTab === 'scope' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Scope Document</h3>
                      <button
                        onClick={() => copyToClipboard(scopeDoc || generateScopeDocument(anchors, references, uploadedFileName))}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border whitespace-pre-wrap">
                      {scopeDoc || generateScopeDocument(anchors, references, uploadedFileName)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingReference && (
        <EditReferenceModal
          editingReference={editingReference}
          anchors={anchors}
          onUpdate={handleUpdateReference}
          onClose={() => setEditingReference(null)}
        />
      )}

      {creatingAnchor && (
        <CreateAnchorModal
          creatingAnchor={creatingAnchor}
          onCreate={handleCreateAnchor}
          onClose={() => setCreatingAnchor(null)}
        />
      )}
    </div>
  );
};

export default YAMLAnchorEditor;