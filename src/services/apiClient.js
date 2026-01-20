/**
 * API Client - Centralized HTTP client for all API calls
 * 
 * Responsibilities:
 * - Configure base URL and default headers
 * - Handle authentication tokens
 * - Provide request/response interceptors
 * - Centralize error handling
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Get auth token from storage (localStorage/cookies)
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Make HTTP request with authentication
 */
const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // If it's already an Error object, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap it in an Error
    throw new Error(error.message || 'Request failed');
  }
};

const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => {
    // Handle body in delete request if provided
    if (options && options.body) {
      return request(endpoint, { ...options, method: 'DELETE' });
    }
    return request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
