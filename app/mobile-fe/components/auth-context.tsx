import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'expo-router';

type User = {
  id?: string;
  name?: string;
  email?: string;
};

interface AuthContextValue {
  // New reactive session + legacy token
  session: any | null;
  user: User | null;
  token: string | null;
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  supabase: typeof supabase;
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
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep this for legacy API calls if needed elsewhere in the app
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

  // Bootstrap from Supabase as the authoritative source of truth.
  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      // Prefer supabase.getSession() over SecureStore.
      const { data } = await supabase.auth.getSession();
      const sess = data.session ?? null;
      setSession(sess);
      setToken(sess?.access_token ?? null);
      if (sess?.user) {
        const u = sess.user;
        setUser({ id: u.id, email: u.email ?? undefined, name: u.user_metadata?.name });
      } else {
        // Fallback: if no session but a token exists in SecureStore, try to validate it against legacy API
        const stored = await getToken();
        if (stored) {
          try {
            const me = await axios.get(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${stored}` } });
            setUser(me.data);
            setToken(stored);
          } catch {
            await deleteToken();
            setToken(null);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (e) {
      // If Supabase call fails, leave user/session null but don't crash the app.
      setSession(null);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    // Run bootstrap on mount.
    (async () => {
      await bootstrap();
    })();

    // Subscribe to auth state changes so UI stays in sync with Supabase auth events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      // Update session/user/token reactively on any auth event (SIGNED_IN, SIGNED_OUT, USER_UPDATED, etc.)
      setSession(sess ?? null);
      setToken(sess?.access_token ?? null);
      if (sess?.user) {
        const u = sess.user;
        setUser({ id: u.id, email: u.email ?? undefined, name: u.user_metadata?.name });
      } else {
        setUser(null);
      }
      // Persist token when present (optional)
      if (sess?.access_token) {
        saveToken(sess.access_token).catch(() => {});
      } else {
        // remove stored token on sign out
        deleteToken().catch(() => {});
      }
    });

    // Cleanup subscription on unmount.
    return () => {
      subscription?.unsubscribe?.();
    };
  }, [bootstrap]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const sess = data.session;
      const u = data.user;
      if (!sess || !u) throw new Error('Invalid Supabase login response');
      // Update local reactive state; onAuthStateChange will also fire but set explicitly here for immediacy.
      setSession(sess);
      await saveToken(sess.access_token);
      setToken(sess.access_token);
      setUser({ id: u.id, email: u.email ?? undefined, name: u.user_metadata?.name });
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) throw error;
      // Depending on Supabase settings, user may need email confirmation.
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined, name } : null);
    } catch (e: any) {
      setError(e.message || 'Signup failed');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Ensure local state is cleared even if signOut network call fails.
      await deleteToken();
      setSession(null);
      setToken(null);
      setUser(null);
      // Navigate to login so user can't go back to protected screens
      router.replace('/login');
    }
  };

  const refresh = async () => {
    // Re-fetch authoritative session from Supabase
    try {
      const { data } = await supabase.auth.getSession();
      const sess = data.session ?? null;
      setSession(sess);
      setToken(sess?.access_token ?? null);
      if (sess?.user) {
        const u = sess.user;
        setUser({ id: u.id, email: u.email ?? undefined, name: u.user_metadata?.name });
      } else {
        setUser(null);
      }
      if (sess?.access_token) {
        await saveToken(sess.access_token);
      }
    } catch {
      // ignore
    }
  };

  const authenticated = !!session;

  const value: AuthContextValue = {
    session,
    user,
    token,
    loading,
    authenticated,
    error,
    supabase,
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
