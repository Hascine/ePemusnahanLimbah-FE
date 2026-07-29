// Token management utilities
export const TokenManager = {
  // Get token dari sessionStorage
  getToken: () => {
    return sessionStorage.getItem('access_token');
  },

  // Set token ke sessionStorage
  setToken: (token) => {
    sessionStorage.setItem('access_token', token);
    localStorage.removeItem('token');
  },

  // Clear token dari auth storage
  clearToken: () => {
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('token');
  },

  // Check apakah user sudah login
  isAuthenticated: () => {
    const token = TokenManager.getToken();
    return !!token;
  },

  // Get user data dari sessionStorage
  getUser: () => {
    const userData = sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  // Set user data ke sessionStorage
  setUser: (userData) => {
    const userString = JSON.stringify(userData);
    sessionStorage.setItem('user', userString);
    localStorage.removeItem('user');
  },

  // Clear user data dari auth storage
  clearUser: () => {
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
  },

  // Clear semua auth data
  clearAll: () => {
    TokenManager.clearToken();
    TokenManager.clearUser();
    sessionStorage.removeItem('delegatedTo');
    localStorage.removeItem('delegatedTo');
  },

  // Add token to URL as query parameter (untuk window.open yang tidak bisa send header)
  addTokenToUrl: (url) => {
    const token = TokenManager.getToken();
    if (!token) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
};

export default TokenManager;
