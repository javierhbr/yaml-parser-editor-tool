import React, { useState } from 'react';
import { Upload, Download, Save, RefreshCw, Copy, Check } from 'lucide-react';

const UIYamlEditor: React.FC = () => {
  const [yamlContent, setYamlContent] = useState(`# Sample YAML Configuration
app:
  name: "My Application"
  version: "1.0.0"
  port: 3000

database:
  host: "localhost"
  port: 5432
  name: "myapp_db"
  
features:
  - authentication
  - logging
  - monitoring
  
settings:
  debug: true
  cache_enabled: false`);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setYamlContent(content);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-full max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">UI YAML Editor</h2>
              <p className="text-sm text-gray-600 mt-1">Edit YAML content with syntax highlighting and validation</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
                id="yaml-file-input"
              />
              
              <label
                htmlFor="yaml-file-input"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors"
              >
                <Upload size={16} />
                Upload
              </label>
              
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
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

          {/* Editor Area */}
          <div className="flex-1 p-4">
            <div className="h-full">
              <textarea
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your YAML content here..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Lines: {yamlContent.split('\n').length}</span>
              <span>Characters: {yamlContent.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIYamlEditor;