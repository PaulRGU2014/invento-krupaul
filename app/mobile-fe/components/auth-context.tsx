import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

type User = {
  id?: string;
  name?: string;
  email?: string;
};

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

// Fallback for web (SecureStore not supported in all browsers)
async function saveToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return localStorage.getItem(TOKEN_KEY);
  }
}

async function deleteToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const stored = await getToken();
    if (stored) {
      setToken(stored);
      try {
        const me = await axios.get(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${stored}` } });
        setUser(me.data);
      } catch {
        // token invalid
        await deleteToken();
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, [API_BASE]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (!res.data?.token) throw new Error('Invalid login response');
      await saveToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user || { email: res.data.email, name: res.data.name });
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      await axios.post(`${API_BASE}/users`, { name, email, password });
    } catch (e: any) {
      setError(e.message || 'Signup failed');
      throw e;
    }
  };

  const logout = async () => {
    await deleteToken();
    setToken(null);
    setUser(null);
  };

  const refresh = async () => bootstrap();

  const value: AuthContextValue = {
    user,
    token,
    loading,
    error,
    login,
    signup,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
