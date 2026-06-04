import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, logoutApi, getMeApi } from '../api/auth.api';
import api, { setAccessToken, clearAccessToken } from '../api/axios.instance';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session from cookie
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
        if (!cancelled) {
          setAccessToken(data.accessToken);
          setToken(data.accessToken);
          // Now fetch full user
          const meRes = await getMeApi();
          if (!cancelled) {
            setUser(meRes.user);
          }
        }
      } catch {
        // No valid session
        if (!cancelled) {
          setUser(null);
          setToken(null);
          clearAccessToken();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const data = await loginApi(email, password, rememberMe);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout errors
    }
    clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    accessToken,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
