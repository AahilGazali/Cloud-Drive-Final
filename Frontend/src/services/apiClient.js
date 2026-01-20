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

  // Include credentials (cookies) for all requests
  config.credentials = 'include';

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    if (!response.ok) {
      // Create an error object that mimics axios error structure
      const error = new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      };
      throw error;
    }

    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout. Please try again.');
      timeoutError.response = {
        status: 0,
        statusText: 'Timeout',
        data: { message: 'Request timeout. Please try again.' },
      };
      throw timeoutError;
    }
    
    // If it's already an Error object with response, re-throw it
    if (error instanceof Error && error.response) {
      throw error;
    }
    // If it's a network error or other error, wrap it properly
    if (error instanceof Error) {
      // Create axios-like structure for network errors
      const networkError = new Error(error.message || 'Network error. Please check your connection.');
      networkError.response = {
        status: 0,
        statusText: 'Network Error',
        data: { message: error.message || 'Network error. Please check your connection.' },
      };
      throw networkError;
    }
    // Otherwise, wrap it in an Error
    const wrappedError = new Error(error.message || 'Request failed');
    wrappedError.response = {
      status: 0,
      statusText: 'Unknown Error',
      data: { message: error.message || 'Request failed' },
    };
    throw wrappedError;
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
