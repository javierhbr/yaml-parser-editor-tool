import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  findAnchors, 
  findReferences, 
  parseYamlString, 
  generateYamlFromJsonWithMetadata 
} from '../utils/yaml-utils';

interface DataContextType {
  data: Record<string, unknown>;
  setData: (newData: Record<string, unknown>) => void;
  fileName: string;
  setFileName: (name: string) => void;
  anchors: { [key: string]: unknown };
  references: Array<{ anchorName: string; path: string }>;
  loadFromFile: (file: File) => Promise<void>;
  exportYaml: () => string;
  error: string | null;
  setError: (error: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getDefaultData = () => ({
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
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setDataState] = useState<Record<string, unknown>>(getDefaultData());
  const [fileName, setFileName] = useState('sample.yaml');
  const [error, setError] = useState<string | null>(null);

  const anchors = findAnchors(data);
  const references = findReferences(data);

  const setData = useCallback((newData: Record<string, unknown>) => {
    setDataState(newData);
    setError(null);
  }, []);

  const loadFromFile = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      let parsedData: Record<string, unknown>;

      if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        parsedData = parseYamlString(content);
      } else if (file.name.endsWith('.json')) {
        parsedData = JSON.parse(content);
      } else {
        throw new Error('Please upload a YAML (.yaml, .yml) or JSON (.json) file');
      }

      setData(parsedData);
      setFileName(file.name);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error loading file: ${errorMessage}`);
      throw err;
    }
  }, [setData]);

  const exportYaml = useCallback(() => {
    try {
      return generateYamlFromJsonWithMetadata(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error generating YAML: ${errorMessage}`);
      return '# Error generating YAML';
    }
  }, [data]);

  const contextValue: DataContextType = {
    data,
    setData,
    fileName,
    setFileName,
    anchors,
    references,
    loadFromFile,
    exportYaml,
    error,
    setError,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};