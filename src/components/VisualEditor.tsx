import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Anchor,
  Link,
  Plus,
  Trash2,
  Target,
  Check,
  X,
} from 'lucide-react';

const VisualEditorElement = ({
  elementKey,
  value,
  path,
  depth = 0,
  isExpanded,
  onToggleExpanded,
  onUpdateData,
  onAddItem,
  onDeleteItem,
  onCreateAnchor,
  onSetReference,
  onRemoveReference,
  anchors = {},
  showMetadata = true,
}) => {
  const [newAnchorName, setNewAnchorName] = useState('');

  // Common dropdown options
  const getFieldOptions = (key) => {
    const optionSets = {
      role: ['guest', 'admin', 'user', 'moderator', 'super_admin'],
      timezone: ['UTC', 'PST', 'EST', 'GMT', 'CST', 'MST', 'JST'],
      adapter: ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'cassandra'],
      status: ['active', 'inactive', 'pending', 'disabled'],
      environment: ['development', 'staging', 'production', 'test'],
      protocol: ['http', 'https', 'tcp', 'udp', 'ws', 'wss'],
      logLevel: ['debug', 'info', 'warn', 'error', 'fatal'],
      priority: ['low', 'medium', 'high', 'critical'],
    };

    return optionSets[key] || [];
  };

  const getBooleanOptions = () => [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ];

  const isBooleanField = (key, val) => {
    return (
      typeof val === 'boolean' ||
      ['enabled', 'disabled', 'active', 'ssl', 'debug', 'email', 'sms', 'push', 'compress'].some(
        (term) => key.toLowerCase().includes(term)
      )
    );
  };

  const isNumberField = (key, val) => {
    return (
      typeof val === 'number' ||
      ['port', 'pool', 'timeout', 'size', 'limit', 'count', 'max', 'min', 'retry'].some((term) =>
        key.toLowerCase().includes(term)
      )
    );
  };

  const renderFormField = (fieldKey, fieldValue, fieldPath, onChange) => {
    const fieldProps = {
      className:
        'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm',
    };

    // Get predefined options for this field
    const options = getFieldOptions(fieldKey);
    if (options.length > 0) {
      return (
        <select
          {...fieldProps}
          value={fieldValue || options[0]}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    // Boolean fields
    if (isBooleanField(fieldKey, fieldValue)) {
      return (
        <select
          {...fieldProps}
          value={String(fieldValue)}
          onChange={(e) => onChange(e.target.value === 'true')}
        >
          {getBooleanOptions().map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    // Number fields
    if (isNumberField(fieldKey, fieldValue)) {
      return (
        <input
          {...fieldProps}
          type="number"
          value={fieldValue || 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min="0"
        />
      );
    }

    // Text fields with smart input types
    const inputType = fieldKey.toLowerCase().includes('password')
      ? 'password'
      : fieldKey.toLowerCase().includes('email')
      ? 'email'
      : fieldKey.toLowerCase().includes('url') || fieldKey.toLowerCase().includes('host')
      ? 'url'
      : 'text';

    return (
      <input
        {...fieldProps}
        type={inputType}
        value={fieldValue || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${fieldKey}`}
      />
    );
  };

  const renderArrayItem = (item, index, arrayPath) => {
    return (
      <div key={index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            Item {index + 1}
            {item?.name && <span className="text-gray-500 ml-2">({item.name})</span>}
            {item?.username && <span className="text-gray-500 ml-2">({item.username})</span>}
          </h4>
          <button
            onClick={() => onDeleteItem(`${arrayPath}[${index}]`)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete item"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {typeof item === 'object' && item !== null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(item)
              .filter(([k]) => k !== 'anchor' && k !== 'referenceOf')
              .map(([itemKey, itemValue]) => (
                <div key={itemKey}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {itemKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                  </label>
                  {typeof itemValue === 'object' && itemValue !== null ? (
                    <div className="text-sm text-gray-500 italic">
                      {Array.isArray(itemValue) ? `[${itemValue.length} items]` : 'Object'}
                    </div>
                  ) : (
                    renderFormField(
                      itemKey,
                      itemValue,
                      `${arrayPath}[${index}].${itemKey}`,
                      (newValue) => onUpdateData(`${arrayPath}[${index}]`, { [itemKey]: newValue })
                    )
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
            {renderFormField('value', item, `${arrayPath}[${index}]`, (newValue) =>
              onUpdateData(`${arrayPath}[${index}]`, newValue)
            )}
          </div>
        )}

        {/* Reference controls for array items */}
        {typeof item === 'object' && item !== null && Object.keys(anchors).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Reference:</span>
              {item.referenceOf ? (
                <select
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                  value={item.referenceOf}
                  onChange={(e) => {
                    if (e.target.value === '__remove__') {
                      onRemoveReference(`${arrayPath}[${index}]`);
                    } else if (e.target.value) {
                      onSetReference(`${arrayPath}[${index}]`, e.target.value);
                    }
                  }}
                >
                  <option value={item.referenceOf}>*{item.referenceOf}</option>
                  <option value="__remove__" className="text-red-600">
                    🗑️ Remove Reference
                  </option>
                  {Object.keys(anchors)
                    .filter((name) => name !== item.referenceOf)
                    .map((anchorName) => (
                      <option key={anchorName} value={anchorName}>
                        *{anchorName}
                      </option>
                    ))}
                </select>
              ) : (
                <select
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onSetReference(`${arrayPath}[${index}]`, e.target.value);
                    }
                  }}
                >
                  <option value="">Set Reference...</option>
                  {Object.keys(anchors).map((anchorName) => (
                    <option key={anchorName} value={anchorName}>
                      *{anchorName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (typeof value !== 'object' || value === null) {
    // Primitive value - shouldn't reach here in normal usage
    return null;
  }

  const isArray = Array.isArray(value);
  const hasReference = value?.referenceOf;
  const hasAnchor = value?.anchor;

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Expand/Collapse */}
            <button
              onClick={() => onToggleExpanded(path)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Title and Type */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 capitalize">
                {elementKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
              </h3>
              {isArray && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {value.length} items
                </span>
              )}
            </div>

            {/* Metadata badges */}
            {showMetadata && hasAnchor && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                <Anchor size={12} />
                {value.anchor}
              </span>
            )}

            {showMetadata && hasReference && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                <Link size={12} />
                {value.referenceOf}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Anchor Creation */}
            {!hasAnchor && !isArray && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Anchor name"
                  value={newAnchorName}
                  onChange={(e) => setNewAnchorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAnchorName.trim()) {
                      onCreateAnchor(path, newAnchorName.trim());
                      setNewAnchorName('');
                    }
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (newAnchorName.trim()) {
                      onCreateAnchor(path, newAnchorName.trim());
                      setNewAnchorName('');
                    }
                  }}
                  disabled={!newAnchorName.trim()}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Create anchor"
                >
                  <Anchor size={14} />
                </button>
              </div>
            )}

            {/* Reference Management */}
            {!isArray && Object.keys(anchors).length > 0 && (
              <div className="flex items-center gap-1">
                {hasReference ? (
                  <select
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={value.referenceOf}
                    onChange={(e) => {
                      if (e.target.value === '__remove__') {
                        onRemoveReference(path);
                      } else if (e.target.value) {
                        onSetReference(path, e.target.value);
                      }
                    }}
                  >
                    <option value={value.referenceOf}>*{value.referenceOf}</option>
                    <option value="__remove__" className="text-red-600">
                      🗑️ Remove Reference
                    </option>
                    {Object.keys(anchors)
                      .filter((name) => name !== value.referenceOf)
                      .map((anchorName) => (
                        <option key={anchorName} value={anchorName}>
                          *{anchorName}
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1">
                    <select
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onSetReference(path, e.target.value);
                        }
                      }}
                    >
                      <option value="">Set Reference...</option>
                      {Object.keys(anchors).map((anchorName) => (
                        <option key={anchorName} value={anchorName}>
                          *{anchorName}
                        </option>
                      ))}
                    </select>
                    <Target size={14} className="text-green-600" />
                  </div>
                )}
              </div>
            )}

            {/* Add Item (for arrays) */}
            {isArray && (
              <button
                onClick={() => onAddItem(path, elementKey === 'users' ? 'user' : 'object')}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Add item"
              >
                <Plus size={14} />
              </button>
            )}

            {/* Delete Element */}
            {depth > 0 && (
              <button
                onClick={() => onDeleteItem(path)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete element"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-white">
          {isArray ? (
            <div className="space-y-4">
              {value.map((item, index) => renderArrayItem(item, index, path))}

              {value.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm">No items yet</p>
                  <button
                    onClick={() => onAddItem(path, elementKey === 'users' ? 'user' : 'object')}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Add First Item
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(value)
                .filter(([k]) => k !== 'anchor' && k !== 'referenceOf')
                .map(([subKey, subValue]) => {
                  if (typeof subValue === 'object' && subValue !== null) {
                    return (
                      <div key={subKey} className="md:col-span-2 lg:col-span-3">
                        <VisualEditorElement
                          elementKey={subKey}
                          value={subValue}
                          path={`${path}.${subKey}`}
                          depth={depth + 1}
                          isExpanded={isExpanded}
                          onToggleExpanded={onToggleExpanded}
                          onUpdateData={onUpdateData}
                          onAddItem={onAddItem}
                          onDeleteItem={onDeleteItem}
                          onCreateAnchor={onCreateAnchor}
                          onSetReference={onSetReference}
                          onRemoveReference={onRemoveReference}
                          anchors={anchors}
                          showMetadata={showMetadata}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={subKey} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {subKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </label>
                      {renderFormField(subKey, subValue, `${path}.${subKey}`, (newValue) =>
                        onUpdateData(path, { [subKey]: newValue })
                      )}
                    </div>
                  );
                })}

              {Object.keys(value).filter((k) => k !== 'anchor' && k !== 'referenceOf').length ===
                0 && (
                <div className="md:col-span-2 lg:col-span-3 text-center py-4 text-gray-500">
                  <div className="text-lg mb-1">🔧</div>
                  <p className="text-sm">No properties configured</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualEditorElement;
