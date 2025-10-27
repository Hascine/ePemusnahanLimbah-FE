// API base URL
const API_BASE_URL = 'http://192.168.1.38/api/lms-dev/v1';

// Helper function to get token from session or localStorage (same as main api.js)
const getAuthToken = () => {
  // Priority: sessionStorage first (access_token), then localStorage (token) as fallback
  return sessionStorage.getItem('access_token') || localStorage.getItem('token');
};

// Create a helper function for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token exists and not explicitly excluded
  if (!options.excludeAuth) {
    const token = getAuthToken();
    if (token) {
      console.log('Adding token to request:', endpoint);
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    console.log('Excluding auth for request:', endpoint);
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Remove excludeAuth from the final config
  delete config.excludeAuth;

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('API Request Error:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred while making the request' 
    };
  }
};

// API endpoints
export const authAPI = {
  login: async (credentials) => {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      excludeAuth: true // Don't include token for login requests
    });
  },
  
  logout: async () => {
    return apiRequest('/logout', {
      method: 'POST',
    });
  },
  
  refreshToken: async () => {
    return apiRequest('/refresh-token', {
      method: 'POST',
    });
  },
  
  getProfile: async () => {
    return apiRequest('/profile');
  },

  // Authenticate user for field verification (independent authentication)
  authenticateUser: async (authData) => {
    // Use login endpoint to verify credentials
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        username: authData.username,
        password: authData.password
      }),
      excludeAuth: true // Don't use session token - each verifier authenticates independently
    });
  },
};

// Export API utilities
export { API_BASE_URL, apiRequest, getAuthToken };
