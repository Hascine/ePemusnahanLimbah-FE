/**
 * Get the base URL including any subdirectory path
 * Handles deployment in subdirectories like /ePemusnahanLimbah-dev
 *
 * @returns {string} Full base URL (e.g., "http://192.168.1.38/ePemusnahanLimbah-dev")
 */
export const getBaseUrl = () => {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Check if app is deployed in a subdirectory
  // Look for /ePemusnahanLimbah-dev at the start of the path
  const basePath =
    pathname.startsWith("/ePemusnahanLimbah-dev") || pathname.includes("/ePemusnahanLimbah-dev")
      ? "/ePemusnahanLimbah-dev"
      : "";

  return origin + basePath;
};

/**
 * Get just the base path without origin
 * @returns {string} Base path (e.g., "/ePemusnahanLimbah-dev" or "")
 */
export const getBasePath = () => {
  const pathname = window.location.pathname;
  return pathname.startsWith("/ePemusnahanLimbah-dev") || pathname.includes("/ePemusnahanLimbah-dev")
    ? "/ePemusnahanLimbah-dev"
    : "";
};
