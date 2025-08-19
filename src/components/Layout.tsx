import React, { useState } from 'react';
import { FileText, Code2 } from 'lucide-react';

interface LayoutProps {
  children: {
    yamlAnchorEditor: React.ReactNode;
    uiYamlEditor: React.ReactNode;
  };
}

type TabType = 'anchor-editor' | 'ui-editor';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('anchor-editor');

  const tabs = [
    {
      id: 'anchor-editor' as TabType,
      label: 'YAML Anchor & Reference Editor',
      icon: FileText,
      description: 'Visualize and manage YAML anchors (&) and references (*)',
    },
    {
      id: 'ui-editor' as TabType,
      label: 'UI YAML Editor',
      icon: Code2,
      description: 'Interactive YAML editor with visual interface',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">YAML Parser & Editor Suite</h1>
            <p className="text-gray-600 text-lg">
              Professional tools for YAML parsing, editing, and anchor management
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-3 py-4 px-6 border-b-2 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="flex-1">
        <div className={`${activeTab === 'anchor-editor' ? 'block' : 'hidden'}`}>
          {children.yamlAnchorEditor}
        </div>
        <div className={`${activeTab === 'ui-editor' ? 'block' : 'hidden'}`}>
          {children.uiYamlEditor}
        </div>
      </main>
    </div>
  );
};

export default Layout;
