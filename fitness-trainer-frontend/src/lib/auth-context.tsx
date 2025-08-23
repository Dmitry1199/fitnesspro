'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (type: 'trainer' | 'client' | 'admin') => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  isTrainer: boolean;
  isClient: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on component mount
    const token = localStorage.getItem('fitnesspro_token');
    if (token) {
      // Try to get user info with existing token
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (type: 'trainer' | 'client' | 'admin') => {
    try {
      setIsLoading(true);
      const response = await apiClient.quickLogin(type);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(email, password);
      setUser(response.user);
    } catch (error) {
      console.error('Login with email failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithEmail,
    logout,
    isTrainer: user?.role === 'TRAINER',
    isClient: user?.role === 'CLIENT',
    isAdmin: user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
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
