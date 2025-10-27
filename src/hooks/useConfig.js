import { useState, useEffect, useCallback } from 'react';
import { configAPI } from '../services/configApi';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing application configuration data
 */
export const useConfig = () => {
  const [config, setConfig] = useState({
    columns: {
      permohonan: [],
      beritaAcara: []
    },
    display: {
      statusProperties: {}
    },
    rules: {
      deletableStatuses: []
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all configuration data
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await configAPI.getAllConfigs();
      
      if (response.data.success) {
        setConfig(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load configuration');
      }
    } catch (err) {
      setError('Failed to load configuration');
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load specific config section
  const loadPermohonanColumns = useCallback(async () => {
    try {
      const response = await configAPI.columns.permohonan();
      if (response.data.success) {
        setConfig(prev => ({
          ...prev,
          columns: {
            ...prev.columns,
            permohonan: response.data.data
          }
        }));
      }
    } catch (err) {
      console.error('Error loading permohonan columns:', err);
    }
  }, []);

  const loadBeritaAcaraColumns = useCallback(async () => {
    try {
      const response = await configAPI.columns.beritaAcara();
      if (response.data.success) {
        setConfig(prev => ({
          ...prev,
          columns: {
            ...prev.columns,
            beritaAcara: response.data.data
          }
        }));
      }
    } catch (err) {
      console.error('Error loading berita acara columns:', err);
    }
  }, []);

  const loadStatusProperties = useCallback(async () => {
    try {
      const response = await configAPI.display.statusProperties();
      if (response.data.success) {
        setConfig(prev => ({
          ...prev,
          display: {
            ...prev.display,
            statusProperties: response.data.data
          }
        }));
      }
    } catch (err) {
      console.error('Error loading status properties:', err);
    }
  }, []);

  const loadDeletableStatuses = useCallback(async () => {
    try {
      const response = await configAPI.rules.deletableStatuses();
      if (response.data.success) {
        setConfig(prev => ({
          ...prev,
          rules: {
            ...prev.rules,
            deletableStatuses: response.data.data
          }
        }));
      }
    } catch (err) {
      console.error('Error loading deletable statuses:', err);
    }
  }, []);

  // Helper functions for common config operations
  const getStatusStyle = useCallback((status) => {
    const statusProps = config.display.statusProperties[status];
    return statusProps || { color: 'gray', backgroundColor: '#f3f4f6' };
  }, [config.display.statusProperties]);

  const isStatusDeletable = useCallback((status) => {
    return config.rules.deletableStatuses.includes(status);
  }, [config.rules.deletableStatuses]);

  const getColumnConfig = useCallback((tableName) => {
    return config.columns[tableName] || [];
  }, [config.columns]);

  // Load config on mount
  // Only load config after authentication is established.
  // This prevents unauthenticated requests (401) during initial mount.
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
    }
  }, [isAuthenticated, loadConfig]);

  return {
    config,
    loading,
    error,
    // Reload functions
    reload: loadConfig,
    reloadPermohonanColumns: loadPermohonanColumns,
    reloadBeritaAcaraColumns: loadBeritaAcaraColumns,
    reloadStatusProperties: loadStatusProperties,
    reloadDeletableStatuses: loadDeletableStatuses,
    // Helper functions
    getStatusStyle,
    isStatusDeletable,
    getColumnConfig
  };
};

export default useConfig;
