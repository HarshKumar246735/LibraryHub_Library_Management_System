import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session after a refresh: the cookie is HttpOnly, so ask the server who we are.
  useEffect(() => {
    authApi.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authApi.login(credentials);
    setUser(u);
    return u;
  }, []);
  const register = useCallback(async (payload) => {
    const u = await authApi.register(payload);
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
