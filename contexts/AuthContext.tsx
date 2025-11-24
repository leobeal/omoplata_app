import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { authApi } from '@/api/auth';
import { setAuthToken as setApiAuthToken } from '@/api/client';
import { useTenant } from '@/contexts/TenantContext';
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
  const { tenant } = useTenant();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previousTenantSlug, setPreviousTenantSlug] = useState<string | null>(null);

  // Initialize auth when component mounts or when tenant changes
  useEffect(() => {
    const currentTenantSlug = tenant?.slug || null;

    // If tenant changed (and it's not the first load), clear auth
    if (previousTenantSlug !== null && previousTenantSlug !== currentTenantSlug) {
      console.log(
        `Tenant changed from ${previousTenantSlug} to ${currentTenantSlug}, clearing auth`
      );
      // Clear the old tenant's auth data
      clearAllAuthData(previousTenantSlug).catch((error) => {
        console.error('Failed to clear old tenant auth:', error);
      });
      // Reset state
      setToken(null);
      setUser(null);
      setApiAuthToken(null);
    }

    setPreviousTenantSlug(currentTenantSlug);
    initializeAuth();
  }, [tenant?.slug]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const tenantSlug = tenant?.slug || null;

      const [storedToken, storedUser] = await Promise.all([
        loadAuthToken(tenantSlug),
        loadUser(tenantSlug),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setApiAuthToken(storedToken);
      } else {
        // No auth data for this tenant
        setToken(null);
        setUser(null);
        setApiAuthToken(null);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.login({ email, password });

      if (response.error || !response.data) {
        return {
          success: false,
          error: response.error || 'Login failed',
        };
      }

      const { token: authToken, refreshToken, user: userData } = response.data;

      // Prepare user data for storage (API already returns camelCase)
      const userToStore: StoredUser = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        profilePicture: userData.profilePicture,
        membershipId: userData.membershipId,
      };

      const tenantSlug = tenant?.slug || null;

      // Save auth token and user data with tenant context
      const savePromises = [
        saveAuthToken(authToken, tenantSlug),
        saveUser(userToStore, tenantSlug),
      ];

      // Only save refresh token if it exists
      if (refreshToken) {
        savePromises.push(saveRefreshToken(refreshToken, tenantSlug));
      }

      await Promise.all(savePromises);

      // Update state
      setToken(authToken);
      setUser(userToStore);
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
      const tenantSlug = tenant?.slug || null;
      // Clear storage and state for current tenant
      await clearAllAuthData(tenantSlug);
      setToken(null);
      setUser(null);
      setApiAuthToken(null);
    }
  };

  const refreshSession = async () => {
    try {
      const tenantSlug = tenant?.slug || null;
      const storedRefreshToken = await loadRefreshToken(tenantSlug);
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(storedRefreshToken);

      if (response.error || !response.data) {
        throw new Error(response.error || 'Token refresh failed');
      }

      const newToken = response.data.token;
      await saveAuthToken(newToken, tenantSlug);
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
