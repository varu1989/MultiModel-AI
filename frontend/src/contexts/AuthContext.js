import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, creditsAPI } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      refreshUser();
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      setCredits(response.data.credits);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const refreshCredits = async () => {
    try {
      const response = await creditsAPI.balance();
      setCredits(response.data.credits);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setCredits(userData.credits);
    
    return userData;
  };

  const signup = async (email, password, name) => {
    const response = await authAPI.signup({ email, password, name });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setCredits(userData.credits);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCredits(0);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      credits,
      isAdmin,
      login,
      signup,
      logout,
      refreshUser,
      refreshCredits,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
