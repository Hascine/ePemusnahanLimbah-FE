import React, { createContext, useContext } from 'react';
import { useConfig } from '../hooks/useConfig';

// Create the context
const ConfigContext = createContext();

// Provider component
export const ConfigProvider = ({ children }) => {
  const configData = useConfig();

  return (
    <ConfigContext.Provider value={configData}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use the config context
export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
};

export default ConfigContext;
