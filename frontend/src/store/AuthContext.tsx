import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { User, AuthTokens } from '../types';

interface AuthContextType {
  user: AuthTokens['user'] | null;
  fullUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username?: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'vppt_access_token';
const REFRESH_KEY = 'vppt_refresh_token';
const USER_KEY = 'vppt_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthTokens['user'] | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [fullUser, setFullUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setFullUser(null);
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await authApi.getMe();
      setFullUser(data);
      const userObj = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        roleId: data.role.roleId,
        roleName: data.role.roleName,
      };
      setUser(userObj);
      localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    } catch {
      // If token expired and refresh fails, clean up all state immediately
      setFullUser(null);
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  const login = async (credentials: { username?: string; email?: string; password: string }) => {
    const authData = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, authData.accessToken);
    localStorage.setItem(REFRESH_KEY, authData.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    setToken(authData.accessToken);
    setUser(authData.user);
    await reloadUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      setFullUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        fullUser,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
