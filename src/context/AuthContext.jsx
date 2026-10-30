'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true on both server and client so hydration matches; the token is only readable in the browser.
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) return setUser(null);
    try {
      const { user } = await api('/auth/me');
      setUser(user);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const handleAuth = ({ token, user }) => {
    setToken(token);
    setUser(user);
    return user;
  };

  const login = async (email, password) => handleAuth(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register = async (data) => handleAuth(await api('/auth/register', { method: 'POST', body: data }));
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const dashboardPath = (user) => (user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student');
