import React from 'react';
import Layout from './components/Layout';
import YAMLAnchorEditor from './yaml-anchor-editor';
import UIYamlEditor from './components/UIYamlEditor';

export default function App() {
  return (
    <Layout>
      {{
        yamlAnchorEditor: <YAMLAnchorEditor />,
        uiYamlEditor: <UIYamlEditor />
      }}
    </Layout>
  );
}
