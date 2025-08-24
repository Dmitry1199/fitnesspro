'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User } from './api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<{ user: User; accessToken: string }>;
  logout: () => void;
  quickLogin: (type?: 'trainer' | 'client' | 'admin') => Promise<{ user: User; accessToken: string }>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const token = localStorage.getItem('fitnesspro_token');
    if (token) {
      apiClient.setToken(token);
      // You could verify the token here by making a profile request
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const response = await apiClient.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const quickLogin = async (type: 'trainer' | 'client' | 'admin' = 'trainer') => {
    try {
      const response = await apiClient.quickLogin(type);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Quick login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        quickLogin,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
