import React, { useCallback, useState } from 'react';
import { Upload, Download, FileText, Edit3, Plus, Trash2, Edit2, Anchor, Link } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import './WebServiceMocksEditor.css';

// Small local helper type for incoming YAML-parsed objects
type LooseRecord = Record<string, unknown>;

const WebServiceMocksEditor: React.FC = () => {
  const {
    mocks,
    setMocks,
    mocksFileName,
    setMocksFileName: _setMocksFileName, // eslint-disable-line @typescript-eslint/no-unused-vars
    mocksAnchors,
    mocksReferences,
    loadMocksFromFile,
    exportMocksYaml,
    error,
    setError,
  } = useDataContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  // editor textarea state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showEditMockModal, setShowEditMockModal] = useState(false);
  const [editingWebservice, setEditingWebservice] = useState<string>('');
  const [editingMock, setEditingMock] = useState<{ webserviceName: string; mockName: string }>({
    webserviceName: '',
    mockName: '',
  });
  const [newMockData, setNewMockData] = useState({
    webserviceName: '',
    mockName: '',
    httpStatus: 200,
    response: '{}',
    baseUrl: '',
    anchor: '',
    referenceOf: '',
  });
  const [editServiceData, setEditServiceData] = useState({
    webserviceName: '',
    baseUrl: '',
  });
  const [editMockData, setEditMockData] = useState({
    mockName: '',
    httpStatus: 200,
    response: '{}',
    anchor: '',
    referenceOf: '',
  });

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        await loadMocksFromFile(file);
        setError(null);
      } catch {
        console.error('Error loading file');
      }
    },
    [loadMocksFromFile, setError]
  );

  const downloadYaml = useCallback(() => {
    const yamlContent = exportMocksYaml();
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mocksFileName.replace(/\.[^/.]+$/, '') + '_mocks.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportMocksYaml, mocksFileName]);

  const handleEdit = useCallback(() => {
    if (isEditing) {
      try {
        const yamlContent = editContent;
        // For now, we'll assume the content is already parsed JSON for simplicity
        // In a real implementation, you'd parse YAML here
        const parsedMocks = JSON.parse(yamlContent);
        setMocks(parsedMocks);
        setIsEditing(false);
        setError(null);
      } catch {
        setError('Invalid JSON/YAML content');
      }
    } else {
      setEditContent(JSON.stringify(mocks, null, 2));
      setIsEditing(true);
    }
  }, [isEditing, editContent, mocks, setMocks, setError]);

  // (line numbers removed) simple textarea used for editing

  const handleCreateMock = useCallback(() => {
    const { webserviceName, mockName, httpStatus, response, baseUrl, anchor, referenceOf } =
      newMockData;

    if (!webserviceName || !mockName) {
      setError('Webservice name and mock name are required');
      return;
    }

    try {
      const responseData = JSON.parse(response);
      const newMocks = { ...mocks };

      // Ensure webservices structure exists
      if (!newMocks.webservices) {
        newMocks.webservices = {};
      }

      const webservices = newMocks.webservices as Record<string, unknown>;

      if (!webservices[webserviceName]) {
        webservices[webserviceName] = {
          base_url: baseUrl || 'https://api.example.com',
          mocks: {},
        };
      }

      const service = webservices[webserviceName] as Record<string, unknown>;
      const serviceMocks = (service.mocks as Record<string, unknown>) || {};
      const newMock: Record<string, unknown> = {
        http_status: httpStatus,
        response: responseData,
      };

      if (anchor) newMock.anchor = anchor;
      if (referenceOf) newMock.referenceOf = referenceOf;

      serviceMocks[mockName] = newMock;
      service.mocks = serviceMocks;

      setMocks(newMocks);
      setShowCreateModal(false);
      setNewMockData({
        webserviceName: '',
        mockName: '',
        httpStatus: 200,
        response: '{}',
        baseUrl: '',
        anchor: '',
        referenceOf: '',
      });
      setError(null);
    } catch {
      setError('Invalid JSON in response field');
    }
  }, [newMockData, mocks, setMocks, setError]);

  const handleEditWebservice = useCallback(
    (webserviceName: string) => {
      const webservices = (mocks.webservices as Record<string, unknown>) || {};
      const service = (webservices[webserviceName] as Record<string, unknown>) || {};

      setEditServiceData({
        webserviceName,
        baseUrl: String(service.base_url || ''),
      });
      setEditingWebservice(webserviceName);
      setShowEditServiceModal(true);
    },
    [mocks]
  );

  const handleSaveEditWebservice = useCallback(() => {
    const { webserviceName, baseUrl } = editServiceData;

    if (!webserviceName) {
      setError('Webservice name is required');
      return;
    }

    const newMocks = { ...mocks };

    if (!newMocks.webservices) {
      newMocks.webservices = {};
    }

    const webservices = newMocks.webservices as Record<string, unknown>;
    const oldService = (webservices[editingWebservice] as Record<string, unknown>) || {};

    // If webservice name changed, move the service
    if (editingWebservice !== webserviceName) {
      delete webservices[editingWebservice];
    }

    webservices[webserviceName] = {
      ...oldService,
      base_url: baseUrl,
    };

    setMocks(newMocks);
    setShowEditServiceModal(false);
    setEditingWebservice('');
    setError(null);
  }, [editServiceData, editingWebservice, mocks, setMocks, setError]);

  const handleRemoveWebservice = useCallback(
    (webserviceName: string) => {
      if (
        confirm(
          `Are you sure you want to remove the webservice '${webserviceName}' and all its mocks?`
        )
      ) {
        const newMocks = { ...mocks };
        const webservices = (newMocks.webservices as Record<string, unknown>) || {};
        delete webservices[webserviceName];
        setMocks(newMocks);
      }
    },
    [mocks, setMocks]
  );

  const handleEditMock = useCallback(
    (webserviceName: string, mockName: string) => {
      const webservices = (mocks.webservices as Record<string, unknown>) || {};
      const service = (webservices[webserviceName] as Record<string, unknown>) || {};
      const serviceMocks = (service.mocks as Record<string, unknown>) || {};
      const mock = (serviceMocks[mockName] as Record<string, unknown>) || {};

      setEditMockData({
        mockName,
        httpStatus: Number(mock.http_status) || 200,
        response: JSON.stringify(mock.response || {}, null, 2),
        anchor: String(mock.anchor || ''),
        referenceOf: String(mock.referenceOf || ''),
      });
      setEditingMock({ webserviceName, mockName });
      setShowEditMockModal(true);
    },
    [mocks]
  );

  const handleSaveEditMock = useCallback(() => {
    const { mockName, httpStatus, response, anchor, referenceOf } = editMockData;
    const { webserviceName } = editingMock;

    if (!mockName) {
      setError('Mock name is required');
      return;
    }

    try {
      const responseData = JSON.parse(response);
      const newMocks = { ...mocks };
      const webservices = (newMocks.webservices as Record<string, unknown>) || {};
      const service = (webservices[webserviceName] as Record<string, unknown>) || {};
      const serviceMocks = (service.mocks as Record<string, unknown>) || {};

      // If mock name changed, remove old one
      if (editingMock.mockName !== mockName) {
        delete serviceMocks[editingMock.mockName];
      }

      const newMock: Record<string, unknown> = {
        http_status: httpStatus,
        response: responseData,
      };

      if (anchor) newMock.anchor = anchor;
      if (referenceOf) newMock.referenceOf = referenceOf;

      serviceMocks[mockName] = newMock;
      service.mocks = serviceMocks;
      webservices[webserviceName] = service;
      newMocks.webservices = webservices;

      setMocks(newMocks);
      setShowEditMockModal(false);
      setEditingMock({ webserviceName: '', mockName: '' });
      setError(null);
    } catch {
      setError('Invalid JSON in response field');
    }
  }, [editMockData, editingMock, mocks, setMocks, setError]);

  const handleRemoveMock = useCallback(
    (webserviceName: string, mockName: string) => {
      if (
        confirm(`Are you sure you want to remove the mock '${mockName}' from '${webserviceName}'?`)
      ) {
        const newMocks = { ...mocks };
        const webservices = (newMocks.webservices as Record<string, unknown>) || {};
        const service = (webservices[webserviceName] as Record<string, unknown>) || {};
        const serviceMocks = (service.mocks as Record<string, unknown>) || {};
        delete serviceMocks[mockName];
        service.mocks = serviceMocks;
        webservices[webserviceName] = service;
        setMocks(newMocks);
      }
    },
    [mocks, setMocks]
  );

  const renderMockService = (webserviceName: string, serviceData: unknown) => {
    const service = serviceData as LooseRecord;
    const serviceMocks = (service.mocks as Record<string, unknown>) || {};

    return (
      <div key={webserviceName} className="card w-full border border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 service-title">
              {webserviceName}
              {service && typeof service.anchor !== 'undefined' && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  <Anchor size={12} />
                  {String(service.anchor)}
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-600">
              Base URL: {String(service.base_url || 'Not specified')}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setNewMockData({
                  webserviceName,
                  mockName: '',
                  httpStatus: 200,
                  response: '{}',
                  baseUrl: String(service.base_url || ''),
                  anchor: '',
                  referenceOf: '',
                });
                setShowCreateModal(true);
              }}
              className="service-btn service-btn-add"
              title="Add Mock"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => handleEditWebservice(webserviceName)}
              className="service-btn service-btn-edit"
              title="Edit Webservice"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleRemoveWebservice(webserviceName)}
              className="service-btn service-btn-remove"
              title="Remove Webservice"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(serviceMocks).map(([mockName, mockData]) => {
            const mock = mockData as LooseRecord;
            return (
              <div key={mockName} className="bg-gray-50 p-3 rounded border-l-4 border-green-400">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">{mockName}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {String(mock.http_status || 200)}
                    </span>
                    {mock && typeof mock.anchor !== 'undefined' && (
                      <span className="px-2 py-1 inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs rounded">
                        <Anchor size={12} />
                        {String(mock.anchor)}
                      </span>
                    )}
                    {mock && typeof mock.referenceOf !== 'undefined' && (
                      <span className="px-2 py-1 inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs rounded">
                        <Link size={12} />
                        {String(mock.referenceOf)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <select
                      value={
                        String(mock.referenceOf || '') &&
                        Object.keys(mocksAnchors || {}).includes(String(mock.referenceOf || ''))
                          ? `Mock:${String(mock.referenceOf || '')}`
                          : String(mock.referenceOf || '')
                      }
                      onChange={(e) => {
                        const newMocks = { ...mocks };
                        const webservices = (newMocks.webservices as Record<string, unknown>) || {};
                        const service =
                          (webservices[webserviceName] as Record<string, unknown>) || {};
                        const serviceMocks = (service.mocks as Record<string, unknown>) || {};
                        const mockObj = serviceMocks[mockName] as Record<string, unknown>;
                        const mockData = mockObj ? { ...mockObj } : {};

                        if (e.target.value === '__remove__' || e.target.value === '') {
                          delete mockData.referenceOf;
                        } else {
                          const actualValue = e.target.value.startsWith('Mock:')
                            ? e.target.value.replace('Mock:', '')
                            : e.target.value;
                          mockData.referenceOf = actualValue;
                        }

                        serviceMocks[mockName] = mockData;
                        service.mocks = serviceMocks;
                        webservices[webserviceName] = service;
                        newMocks.webservices = webservices;
                        setMocks(newMocks);
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50"
                      title="Set Reference"
                    >
                      <option value="">— Select Reference —</option>
                      {String(mock.referenceOf || '') && (
                        <option
                          value={
                            Object.keys(mocksAnchors || {}).includes(String(mock.referenceOf || ''))
                              ? `Mock:${String(mock.referenceOf)}`
                              : String(mock.referenceOf)
                          }
                        >
                          Current:{' '}
                          {Object.keys(mocksAnchors || {}).includes(String(mock.referenceOf || ''))
                            ? 'Mock: '
                            : ''}
                          *{String(mock.referenceOf)}
                        </option>
                      )}
                      {String(mock.referenceOf || '') && (
                        <option value="__remove__">✕ Remove Reference</option>
                      )}
                      {Object.keys(mocksAnchors || {}).length === 0 && (
                        <option disabled>No anchors available</option>
                      )}
                      {Object.keys(mocksAnchors || {})
                        .filter(
                          (a) =>
                            a !== String(mock.anchor) &&
                            a !== String(mock.referenceOf).replace('Mock:', '')
                        )
                        .map((anchorName) => (
                          <option key={anchorName} value={`Mock:${anchorName}`}>
                            Mock: *{anchorName}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleEditMock(webserviceName, mockName)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Mock"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveMock(webserviceName, mockName)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Remove Mock"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <pre className="whitespace-pre-wrap bg-white p-2 rounded border mock-row">
                    {JSON.stringify(mock.response || {}, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="h-full flex flex-col webservice-editor">
        <div className="max-w-[80%] mx-auto px-4 py-6 w-full">
          <div className="card p-4 mb-4 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold mb-1">Edit Mocks YAML</h2>
              <p className="text-sm text-gray-600">
                Edit the raw YAML/JSON for mocks. Use Save to apply changes to the workspace.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
              >
                Save
              </button>
            </div>
          </div>

          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="edit-textarea"
            placeholder="Enter mocks JSON/YAML content..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-[80%] flex flex-col webservice-editor">
      <div className=" mx-auto px-4 py-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">WebService Mocks</h2>
          <div className="flex items-center space-x-2 header-actions">
            <input
              type="file"
              id="mocks-file-upload"
              accept=".yaml,.yml,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="mocks-file-upload" className="btn btn-import">
              <Upload size={16} />
              <span>Import</span>
            </label>
            <button onClick={downloadYaml} className="btn btn-export">
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={handleEdit}
              className="btn btn-edit"
              disabled={Object.keys(mocks).length === 0}
            >
              <Edit3 size={16} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-create"
              disabled={Object.keys(mocks).length === 0}
            >
              <Plus size={16} />
              <span>Create Mock</span>
            </button>
          </div>
        </div>

        {/* File Info */}
        <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <FileText size={16} />
            <span>{mocksFileName}</span>
          </div>
          <div>Anchors: {Object.keys(mocksAnchors).length}</div>
          <div>References: {mocksReferences.length}</div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Mocks Content */}
        <div className="flex-1 overflow-auto">
          {Object.keys(mocks).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No mocks loaded. Import a YAML file or create new mocks.</p>
            </div>
          ) : (
            <div>
              {Object.entries(mocks)
                .map(([categoryName, categoryData]) => {
                  // Handle both flat structure and nested structure
                  if (categoryName === 'webservices' || categoryName === 'services') {
                    // Nested structure: webservices -> webservice -> mocks
                    const webservices = categoryData as Record<string, unknown>;
                    return Object.entries(webservices).map(([webserviceName, serviceData]) =>
                      renderMockService(webserviceName, serviceData)
                    );
                  } else if (
                    categoryName === 'common_responses' ||
                    categoryName === 'shared' ||
                    categoryName === 'common'
                  ) {
                    // Common responses section
                    return (
                      <div key={categoryName} className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                          Common Responses
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(categoryData as Record<string, unknown>).map(
                            ([responseName, responseData]) => {
                              const response = responseData as LooseRecord;
                              return (
                                <div
                                  key={responseName}
                                  className="card w-full border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50 border-l-4 border-purple-400"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-700">
                                        {responseName}
                                      </span>
                                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                        {String(response.http_status || 200)}
                                      </span>
                                      {response && typeof response.anchor !== 'undefined' && (
                                        <span className="px-2 py-1 inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs rounded">
                                          <Anchor size={12} />
                                          {String(response.anchor)}
                                        </span>
                                      )}
                                      {response && typeof response.referenceOf !== 'undefined' && (
                                        <span className="px-2 py-1 inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs rounded">
                                          <Link size={12} />
                                          {String(response.referenceOf)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <select
                                        value={
                                          String(response.referenceOf || '') &&
                                          Object.keys(mocksAnchors || {}).includes(
                                            String(response.referenceOf || '')
                                          )
                                            ? `Mock:${String(response.referenceOf || '')}`
                                            : String(response.referenceOf || '')
                                        }
                                        onChange={(e) => {
                                          const newMocks = { ...mocks };
                                          const categoryObj = newMocks[categoryName] as Record<
                                            string,
                                            unknown
                                          >;
                                          const category = categoryObj ? { ...categoryObj } : {};
                                          const responseObj = category[responseName] as Record<
                                            string,
                                            unknown
                                          >;
                                          const responseData = responseObj
                                            ? { ...responseObj }
                                            : {};

                                          if (
                                            e.target.value === '__remove__' ||
                                            e.target.value === ''
                                          ) {
                                            delete responseData.referenceOf;
                                          } else {
                                            const actualValue = e.target.value.startsWith('Mock:')
                                              ? e.target.value.replace('Mock:', '')
                                              : e.target.value;
                                            responseData.referenceOf = actualValue;
                                          }

                                          category[responseName] = responseData;
                                          (newMocks as Record<string, unknown>)[categoryName] =
                                            category;
                                          setMocks(newMocks);
                                        }}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50"
                                        title="Set Reference"
                                      >
                                        <option value="">— Select Reference —</option>
                                        {String(response.referenceOf || '') && (
                                          <option
                                            value={
                                              Object.keys(mocksAnchors || {}).includes(
                                                String(response.referenceOf || '')
                                              )
                                                ? `Mock:${String(response.referenceOf)}`
                                                : String(response.referenceOf)
                                            }
                                          >
                                            Current:{' '}
                                            {Object.keys(mocksAnchors || {}).includes(
                                              String(response.referenceOf || '')
                                            )
                                              ? 'Mock: '
                                              : ''}
                                            *{String(response.referenceOf)}
                                          </option>
                                        )}
                                        {String(response.referenceOf || '') && (
                                          <option value="__remove__">✕ Remove Reference</option>
                                        )}
                                        {Object.keys(mocksAnchors || {}).length === 0 && (
                                          <option disabled>No anchors available</option>
                                        )}
                                        {Object.keys(mocksAnchors || {})
                                          .filter(
                                            (a) =>
                                              a !== String(response.anchor) &&
                                              a !== String(response.referenceOf)
                                          )
                                          .map((anchorName) => (
                                            <option key={anchorName} value={`Mock:${anchorName}`}>
                                              Mock: *{anchorName}
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <pre className="whitespace-pre-wrap bg-white p-4 rounded border text-sm">
                                      {JSON.stringify(response.response || {}, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Flat structure: assume it's a service directly
                    return renderMockService(categoryName, categoryData);
                  }
                })
                .flat()}
            </div>
          )}
        </div>
      </div>
      {/* Create Mock Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-bold mb-4">
              {newMockData.webserviceName &&
              (mocks.webservices as LooseRecord)?.[newMockData.webserviceName]
                ? 'Add Mock'
                : 'Create New Webservice'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Webservice Name</label>
                <input
                  type="text"
                  value={newMockData.webserviceName}
                  onChange={(e) =>
                    setNewMockData({ ...newMockData, webserviceName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., User Management API"
                  disabled={Boolean(
                    newMockData.webserviceName &&
                      (mocks.webservices as LooseRecord)?.[newMockData.webserviceName] !== undefined
                  )}
                />
              </div>
              {(!newMockData.webserviceName ||
                !(mocks.webservices as Record<string, unknown>)?.[newMockData.webserviceName]) && (
                <div>
                  <label className="block text-sm font-medium mb-1">Base URL (optional)</label>
                  <input
                    type="text"
                    value={newMockData.baseUrl}
                    onChange={(e) => setNewMockData({ ...newMockData, baseUrl: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., https://api.example.com"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Mock Name</label>
                <input
                  type="text"
                  value={newMockData.mockName}
                  onChange={(e) => setNewMockData({ ...newMockData, mockName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., get_user_success, login_failed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HTTP Status</label>
                <input
                  type="number"
                  value={newMockData.httpStatus}
                  onChange={(e) =>
                    setNewMockData({ ...newMockData, httpStatus: parseInt(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Anchor (optional)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMockData.anchor || ''}
                        onChange={(e) => setNewMockData({ ...newMockData, anchor: e.target.value })}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        placeholder="e.g., user-success"
                      />
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-10 h-10 border border-gray-200 rounded bg-gray-50"
                        title="Anchor"
                        onClick={() => {
                          // visual affordance: if there's no anchor, generate a simple slug
                          if (!newMockData.anchor) {
                            const slug = (newMockData.mockName || 'mock')
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '');
                            setNewMockData({ ...newMockData, anchor: slug });
                          }
                        }}
                      >
                        <Anchor size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Reference Of (optional)
                    </label>
                    <select
                      value={
                        newMockData.referenceOf &&
                        Object.keys(mocksAnchors || {}).includes(newMockData.referenceOf)
                          ? `Mock:${newMockData.referenceOf}`
                          : newMockData.referenceOf || ''
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '__remove__') {
                          setNewMockData({ ...newMockData, referenceOf: '' });
                        } else {
                          const actualValue = v.startsWith('Mock:') ? v.replace('Mock:', '') : v;
                          setNewMockData({ ...newMockData, referenceOf: actualValue });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                    >
                      <option value="">Set Reference...</option>
                      <option value="__remove__">🗑️ Remove Reference</option>
                      {Object.keys(mocksAnchors || {}).map((anchorName) => (
                        <option key={anchorName} value={`Mock:${anchorName}`}>
                          Mock: *{anchorName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="block text-sm font-medium mb-1">Response JSON</label>
                <textarea
                  value={newMockData.response}
                  onChange={(e) => setNewMockData({ ...newMockData, response: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded h-24 font-mono text-sm"
                  placeholder='{"message": "Success"}'
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewMockData({
                    webserviceName: '',
                    mockName: '',
                    httpStatus: 200,
                    response: '{}',
                    baseUrl: '',
                    anchor: '',
                    referenceOf: '',
                  });
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMock}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
              >
                {newMockData.webserviceName &&
                (mocks.webservices as Record<string, unknown>)?.[newMockData.webserviceName]
                  ? 'Add Mock'
                  : 'Create Webservice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-bold mb-4">Edit Webservice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Webservice Name</label>
                <input
                  type="text"
                  value={editServiceData.webserviceName}
                  onChange={(e) =>
                    setEditServiceData({ ...editServiceData, webserviceName: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., User Management API"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base URL</label>
                <input
                  type="text"
                  value={editServiceData.baseUrl}
                  onChange={(e) =>
                    setEditServiceData({ ...editServiceData, baseUrl: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., https://api.example.com/users"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditServiceModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditWebservice}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mock Modal */}
      {showEditMockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card bg-white rounded-lg p-6 w-[600px] max-w-90vw">
            <h3 className="text-lg font-bold mb-4">Edit Mock</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mock Name</label>
                <input
                  type="text"
                  value={editMockData.mockName}
                  onChange={(e) => setEditMockData({ ...editMockData, mockName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., get_user_success, login_failed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HTTP Status</label>
                <input
                  type="number"
                  value={editMockData.httpStatus}
                  onChange={(e) =>
                    setEditMockData({ ...editMockData, httpStatus: parseInt(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Anchor (optional)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editMockData.anchor}
                      onChange={(e) => setEditMockData({ ...editMockData, anchor: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded"
                      placeholder="e.g., user-success"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-10 h-10 border border-gray-200 rounded bg-gray-50"
                      title="Anchor"
                      onClick={() => {
                        // keep as visual affordance; anchor value is in the input
                      }}
                    >
                      <Anchor size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reference Of (optional)</label>
                  <select
                    value={
                      editMockData.referenceOf &&
                      Object.keys(mocksAnchors || {}).includes(editMockData.referenceOf)
                        ? `Mock:${editMockData.referenceOf}`
                        : editMockData.referenceOf || ''
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '__remove__') {
                        setEditMockData({ ...editMockData, referenceOf: '' });
                      } else {
                        const actualValue = v.startsWith('Mock:') ? v.replace('Mock:', '') : v;
                        setEditMockData({ ...editMockData, referenceOf: actualValue });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  >
                    <option value="">Set Reference...</option>
                    {editMockData.referenceOf && (
                      <option
                        value={
                          Object.keys(mocksAnchors || {}).includes(editMockData.referenceOf)
                            ? `Mock:${editMockData.referenceOf}`
                            : editMockData.referenceOf
                        }
                      >
                        Current:{' '}
                        {Object.keys(mocksAnchors || {}).includes(editMockData.referenceOf)
                          ? 'Mock: '
                          : ''}
                        *{editMockData.referenceOf}
                      </option>
                    )}
                    <option value="__remove__">🗑️ Remove Reference</option>
                    {Object.keys(mocksAnchors || {})
                      .filter((a) => a !== editMockData.anchor)
                      .map((anchorName) => (
                        <option key={anchorName} value={`Mock:${anchorName}`}>
                          Mock: *{anchorName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Response JSON</label>
                <textarea
                  value={editMockData.response}
                  onChange={(e) => setEditMockData({ ...editMockData, response: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded h-32 font-mono text-sm"
                  placeholder='{"message": "Success"}'
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditMockModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditMock}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebServiceMocksEditor;
