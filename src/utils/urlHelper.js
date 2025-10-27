/**
 * Get the base URL including any subdirectory path
 * Handles deployment in subdirectories like /ePemusnahanLimbah
 * 
 * @returns {string} Full base URL (e.g., "http://192.168.1.38/ePemusnahanLimbah")
 */
export const getBaseUrl = () => {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  
  // Check if app is deployed in a subdirectory
  // Look for /ePemusnahanLimbah at the start of the path
  const basePath = pathname.startsWith('/ePemusnahanLimbah') || pathname.includes('/ePemusnahanLimbah') 
    ? '/ePemusnahanLimbah' 
    : '';
  
  return origin + basePath;
};

/**
 * Get just the base path without origin
 * @returns {string} Base path (e.g., "/ePemusnahanLimbah" or "")
 */
export const getBasePath = () => {
  const pathname = window.location.pathname;
  return pathname.startsWith('/ePemusnahanLimbah') || pathname.includes('/ePemusnahanLimbah')
    ? '/ePemusnahanLimbah'
    : '';
};
