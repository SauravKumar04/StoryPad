import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api, { setLogoutCallback } from '../utils/api';

const AuthContext = createContext();

// Helper function to check if token is valid (not expired)
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return false;
    const payload = JSON.parse(atob(base64Payload));
    const currentTime = Math.floor(Date.now() / 1000);
    // If no exp field, assume valid
    return !payload.exp || payload.exp > currentTime;
  } catch (error) {
    console.warn('Token parse failed, treating as invalid:', error);
    return false;
  }
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    // Register logout callback with api utility
    setLogoutCallback(logout);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Validate token before setting user
        if (isTokenValid(token)) {
          setUser(parsedUser);
        } else {
          // Token is expired, clear it
          logout();
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        logout();
      }
    }
    setLoading(false);
  }, [logout]);


  const login = useCallback(async (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  // Method to check if current user session is valid
  const checkTokenValidity = useCallback(() => {
    const token = localStorage.getItem('token');
    return isTokenValid(token);
  }, []);

  const value = {
    user,
    login,
    logout,
    checkTokenValidity,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};