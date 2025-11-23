import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  saveAuthToken,
  loadAuthToken,
  saveRefreshToken,
  loadRefreshToken,
  saveUser,
  loadUser,
  clearAllAuthData,
  StoredUser,
} from '@/utils/auth-storage';
import { setAuthToken as setApiAuthToken } from '@/api/client';
import { authApi, type User } from '@/api/auth';

interface AuthContextType {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const [storedToken, storedUser] = await Promise.all([
        loadAuthToken(),
        loadUser(),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setApiAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.login({ email, password });

      if (response.error || !response.data) {
        return {
          success: false,
          error: response.error || 'Login failed',
        };
      }

      const { token: authToken, refreshToken, user: userData } = response.data;

      // Transform API response (snake_case) to internal format (camelCase)
      const transformedUser: StoredUser = {
        id: userData.prefixed_id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        avatar: userData.profile_picture,
        membershipId: userData.membership_id,
      };

      // Save auth token and user data
      const savePromises = [
        saveAuthToken(authToken),
        saveUser(transformedUser),
      ];

      // Only save refresh token if it exists
      if (refreshToken) {
        savePromises.push(saveRefreshToken(refreshToken));
      }

      await Promise.all(savePromises);

      // Update state
      setToken(authToken);
      setUser(transformedUser);
      setApiAuthToken(authToken);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear storage and state
      await clearAllAuthData();
      setToken(null);
      setUser(null);
      setApiAuthToken(null);
    }
  };

  const refreshSession = async () => {
    try {
      const storedRefreshToken = await loadRefreshToken();
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(storedRefreshToken);

      if (response.error || !response.data) {
        throw new Error(response.error || 'Token refresh failed');
      }

      const newToken = response.data.token;
      await saveAuthToken(newToken);
      setToken(newToken);
      setApiAuthToken(newToken);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // If refresh fails, logout the user
      await logout();
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
