/**
 * Get the base URL including any subdirectory path
 * Handles deployment in subdirectories like /ePemusnahanLimbah or /ePemusnahanLimbah-dev
 *
 * @returns {string} Full base URL (e.g., "http://192.168.1.38/ePemusnahanLimbah-dev")
 */
export const getBaseUrl = () => {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Check for dev environment first (more specific)
  if (pathname.startsWith("/ePemusnahanLimbah-dev") || pathname.includes("/ePemusnahanLimbah-dev")) {
    return origin + "/ePemusnahanLimbah-dev";
  }

  // Then check for production environment
  if (pathname.startsWith("/ePemusnahanLimbah") || pathname.includes("/ePemusnahanLimbah")) {
    return origin + "/ePemusnahanLimbah";
  }

  // Default to origin only for local development
  return origin;
};

/**
 * Get just the base path without origin
 * @returns {string} Base path (e.g., "/ePemusnahanLimbah-dev" or "/ePemusnahanLimbah" or "")
 */
export const getBasePath = () => {
  const pathname = window.location.pathname;

  // Check for dev environment first (more specific)
  if (pathname.startsWith("/ePemusnahanLimbah-dev") || pathname.includes("/ePemusnahanLimbah-dev")) {
    return "/ePemusnahanLimbah-dev";
  }

  // Then check for production environment
  if (pathname.startsWith("/ePemusnahanLimbah") || pathname.includes("/ePemusnahanLimbah")) {
    return "/ePemusnahanLimbah";
  }

  // Default to empty for local development
  return "";
};
