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
  mocks: Record<string, unknown>;
  setMocks: (newMocks: Record<string, unknown>) => void;
  fileName: string;
  setFileName: (name: string) => void;
  mocksFileName: string;
  setMocksFileName: (name: string) => void;
  anchors: { [key: string]: unknown };
  references: Array<{ anchorName: string; path: string; anchor: string; data: unknown }>;
  mocksAnchors: { [key: string]: unknown };
  mocksReferences: Array<{ anchorName: string; path: string; anchor: string; data: unknown }>;
  loadFromFile: (file: File) => Promise<void>;
  loadMocksFromFile: (file: File) => Promise<void>;
  exportYaml: () => string;
  exportMocksYaml: () => string;
  error: string | null;
  setError: (error: string | null) => void;
  allAnchors: { [key: string]: unknown };
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

const getDefaultMocks = () => ({
  webservices: {
    'User Management API': {
      base_url: 'https://api.example.com/users',
      mocks: {
        get_user_success: {
          http_status: 200,
          response: {
            id: 123,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'admin',
            created_at: '2024-01-15T09:30:00Z'
          },
          anchor: 'user-success-response'
        },
        get_user_not_found: {
          http_status: 404,
          response: {
            error: 'User not found',
            code: 'USER_NOT_FOUND',
            message: 'The requested user does not exist'
          },
          anchor: 'user-not-found-response'
        },
        create_user_success: {
          http_status: 201,
          response: {
            id: 124,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'user',
            created_at: '2024-01-16T14:22:00Z'
          }
        }
      }
    },
    'Authentication Service': {
      base_url: 'https://auth.example.com',
      mocks: {
        login_success: {
          http_status: 200,
          response: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refresh_token: 'def502001234567890abcdef...',
            expires_in: 3600,
            token_type: 'Bearer',
            user: {
              id: 123,
              name: 'John Doe',
              email: 'john.doe@example.com'
            }
          },
          anchor: 'auth-login-success'
        },
        login_invalid_credentials: {
          http_status: 401,
          response: {
            error: 'invalid_credentials',
            error_description: 'The username or password is incorrect',
            code: 'AUTH_FAILED'
          }
        },
        refresh_token_expired: {
          http_status: 401,
          response: {
            error: 'token_expired',
            error_description: 'The refresh token has expired',
            code: 'TOKEN_EXPIRED'
          },
          referenceOf: 'common-unauthorized'
        }
      }
    },
    'Payment Processing API': {
      base_url: 'https://payments.example.com',
      mocks: {
        process_payment_success: {
          http_status: 200,
          response: {
            transaction_id: 'txn_1234567890',
            amount: 99.99,
            currency: 'USD',
            status: 'completed',
            payment_method: {
              type: 'credit_card',
              last_four: '4242',
              brand: 'visa'
            },
            created_at: '2024-01-16T10:30:00Z'
          },
          anchor: 'payment-success'
        },
        payment_declined: {
          http_status: 402,
          response: {
            error: 'payment_declined',
            code: 'PAYMENT_DECLINED',
            message: 'Your card was declined',
            decline_reason: 'insufficient_funds',
            transaction_id: 'txn_1234567891'
          }
        },
        payment_processing: {
          http_status: 202,
          response: {
            transaction_id: 'txn_1234567892',
            status: 'processing',
            message: 'Payment is being processed'
          }
        }
      }
    }
  },
  common_responses: {
    server_error: {
      http_status: 500,
      response: {
        error: 'internal_server_error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        timestamp: '2024-01-16T12:00:00Z',
        request_id: 'req_abc123def456'
      },
      anchor: 'common-server-error'
    },
    validation_error: {
      http_status: 400,
      response: {
        error: 'validation_error',
        message: 'The request data is invalid',
        code: 'VALIDATION_FAILED',
        details: [
          {
            field: 'email',
            message: 'Invalid email format'
          }
        ]
      },
      anchor: 'common-validation-error'
    },
    unauthorized: {
      http_status: 401,
      response: {
        error: 'unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      },
      anchor: 'common-unauthorized'
    }
  }
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setDataState] = useState<Record<string, unknown>>(getDefaultData());
  const [mocks, setMocksState] = useState<Record<string, unknown>>(getDefaultMocks());
  const [fileName, setFileName] = useState('sample.yaml');
  const [mocksFileName, setMocksFileName] = useState('webservice-mocks.yaml');
  const [error, setError] = useState<string | null>(null);

  const anchors = findAnchors(data);
  const references = findReferences(data).map(ref => ({ ...ref, anchorName: ref.anchor }));
  const mocksAnchors = findAnchors(mocks);
  const mocksReferences = findReferences(mocks).map(ref => ({ ...ref, anchorName: ref.anchor }));
  const allAnchors = { ...anchors, ...mocksAnchors };

  const setData = useCallback((newData: Record<string, unknown>) => {
    setDataState(newData);
    setError(null);
  }, []);

  const setMocks = useCallback((newMocks: Record<string, unknown>) => {
    setMocksState(newMocks);
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

  const loadMocksFromFile = useCallback(async (file: File) => {
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

      setMocks(parsedData);
      setMocksFileName(file.name);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error loading mocks file: ${errorMessage}`);
      throw err;
    }
  }, [setMocks]);

  const exportYaml = useCallback(() => {
    try {
      return generateYamlFromJsonWithMetadata(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error generating YAML: ${errorMessage}`);
      return '# Error generating YAML';
    }
  }, [data]);

  const exportMocksYaml = useCallback(() => {
    try {
      return generateYamlFromJsonWithMetadata(mocks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error generating mocks YAML: ${errorMessage}`);
      return '# Error generating mocks YAML';
    }
  }, [mocks]);

  const contextValue: DataContextType = {
    data,
    setData,
    mocks,
    setMocks,
    fileName,
    setFileName,
    mocksFileName,
    setMocksFileName,
    anchors,
    references,
    mocksAnchors,
    mocksReferences,
    allAnchors,
    loadFromFile,
    loadMocksFromFile,
    exportYaml,
    exportMocksYaml,
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