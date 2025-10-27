import React from 'react';
import { useConfigContext } from '../contexts/ConfigContext';

/**
 * Example component showing how to use configuration data
 */
const ConfigDemo = () => {
  const { 
    config, 
    loading, 
    error, 
    getStatusStyle, 
    isStatusDeletable, 
    getColumnConfig 
  } = useConfigContext();

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Loading configuration...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error loading configuration: {error}</div>
      </div>
    );
  }

  const statuses = ['Draft', 'InProgress', 'Completed', 'Rejected'];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuration Demo</h1>
      
      {/* Status Display Properties */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Status Display Properties</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statuses.map(status => {
            const style = getStatusStyle(status);
            const isDeletable = isStatusDeletable(status);
            
            return (
              <div key={status} className="space-y-2">
                <div 
                  className="px-3 py-2 rounded-md text-center text-sm font-medium"
                  style={{ 
                    color: style.color, 
                    backgroundColor: style.backgroundColor 
                  }}
                >
                  {status}
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {isDeletable ? '✓ Deletable' : '✗ Protected'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Column Configurations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Permohonan Columns */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Permohonan Columns</h2>
          <div className="space-y-2">
            {getColumnConfig('permohonan').map((column, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium">{column.name || column.field}</span>
                <span className="text-sm text-gray-500">
                  {column.type || 'text'}
                </span>
              </div>
            ))}
            {getColumnConfig('permohonan').length === 0 && (
              <div className="text-gray-500 text-sm">No column configuration available</div>
            )}
          </div>
        </div>

        {/* Berita Acara Columns */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Berita Acara Columns</h2>
          <div className="space-y-2">
            {getColumnConfig('beritaAcara').map((column, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium">{column.name || column.field}</span>
                <span className="text-sm text-gray-500">
                  {column.type || 'text'}
                </span>
              </div>
            ))}
            {getColumnConfig('beritaAcara').length === 0 && (
              <div className="text-gray-500 text-sm">No column configuration available</div>
            )}
          </div>
        </div>
      </div>

      {/* Raw Configuration Data */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Raw Configuration Data</h2>
        <pre className="text-xs overflow-auto bg-white p-3 rounded border">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ConfigDemo;
