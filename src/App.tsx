import React from 'react';
import Layout from './components/Layout';
import YAMLAnchorEditor from './yaml-anchor-editor';
import UIYamlEditor from './components/UIYamlEditor';
import { DataProvider } from './context/DataContext';

export default function App() {
  return (
    <DataProvider>
      <Layout>
        {{
          yamlAnchorEditor: <YAMLAnchorEditor />,
          uiYamlEditor: <UIYamlEditor />,
        }}
      </Layout>
    </DataProvider>
  );
}
