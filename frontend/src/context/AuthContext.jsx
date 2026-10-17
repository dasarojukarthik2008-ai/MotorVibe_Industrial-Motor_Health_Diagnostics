import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { closeSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await authApi.getMe();
        if (isMounted && res.success) {
          setUser(res.user);
        }
      } catch (_err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkSession();
    return () => { isMounted = false; };
  }, []);

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    if (!res.success) throw new Error(res.message || 'Login failed.');
    setUser(res.user);
    return res;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    if (!res.success) throw new Error(res.message || 'Registration failed.');
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      closeSocket();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
