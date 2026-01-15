/**
 * Auth Context - Global authentication state management
 * 
 * Responsibilities:
 * - Store current user and auth state
 * - Provide login/logout functions
 * - Persist auth state across page refreshes
 * 
 * Import rules:
 * - Can import: services (authService)
 * - Should NOT import: components, pages
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signup = async (name, email, password) => {
    const response = await authService.signup(email, password, name);
    return response;
  };

  const login = async (email, password) => {
    const response = await authService.signin(email, password);
    // Backend may return token in response or set it in cookie
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    // Fetch user data after login
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // If getCurrentUser fails, try to use user from response
      if (response.user) {
        setUser(response.user);
      }
    }
    return response;
  };

  const logout = async () => {
    try {
      await authService.signout();
    } catch (error) {
      // Continue with logout even if API call fails
    }
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
