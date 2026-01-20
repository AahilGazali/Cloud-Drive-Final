/**
 * Auth Service - Handles all authentication-related API calls
 * 
 * Responsibilities:
 * - Sign up, sign in, sign out
 * - Token management
 * - User profile operations
 * 
 * Import rules:
 * - Can import: apiClient
 * - Should NOT import: components, hooks, context (to avoid circular deps)
 */

import apiClient from './apiClient';

export const authService = {
  /**
   * Sign up a new user
   * POST /api/auth/signup
   */
  signup: async (email, password, name) => {
    // Backend expects email and password, name is optional
    const response = await apiClient.post('/auth/signup', { email, password, name });
    return response;
  },

  /**
   * Sign in existing user
   * POST /api/auth/login
   */
  signin: async (email, password, rememberMe = false) => {
    const response = await apiClient.post('/auth/login', { email, password, rememberMe });
    // Backend may set token in cookie, but we also check response
    // If backend returns token in response, use it; otherwise token is in cookie
    return response;
  },

  /**
   * Sign out current user
   * POST /api/auth/signout
   */
  signout: async () => {
    return apiClient.post('/auth/signout');
  },

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },

  /**
   * Change user email
   * PUT /api/auth/change-email
   */
  changeEmail: async (newEmail, password) => {
    return apiClient.put('/auth/change-email', { newEmail, password });
  },

  /**
   * Change user password
   * PUT /api/auth/change-password
   */
  changePassword: async (currentPassword, newPassword) => {
    return apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },
};
