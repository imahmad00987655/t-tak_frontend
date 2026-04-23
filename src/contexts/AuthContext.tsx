import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { User, UserRole } from '@/types';
import { loginWithCredentials, quickLoginByRole } from '@/lib/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const STORAGE_KEY = 'tiktakwater.auth.user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  });

  const saveUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole = 'admin') => {
    const hasCredentials = email.trim() && password.trim();
    const authUser = hasCredentials
      ? await loginWithCredentials(email, password)
      : await quickLoginByRole(role);
    saveUser(authUser);
  }, [saveUser]);

  const logout = useCallback(() => {
    saveUser(null);
  }, [saveUser]);

  const switchRole = useCallback(async (role: UserRole) => {
    const authUser = await quickLoginByRole(role);
    saveUser(authUser);
  }, [saveUser]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    logout,
    switchRole,
  }), [user, login, logout, switchRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
