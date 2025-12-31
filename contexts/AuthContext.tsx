import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { switchToChild as switchToChildApi } from '@/api/account-switch';
import { authApi } from '@/api/auth';
import { api, setAuthToken as setApiAuthToken, setOnUnauthorized } from '@/api/client';
import { Child, getProfile } from '@/api/profile';
import reverbClient from '@/api/pusher';
import { useTenant } from '@/contexts/TenantContext';
import {
  saveAuthToken,
  loadAuthToken,
  saveRefreshToken,
  loadRefreshToken,
  saveUser,
  loadUser,
  clearAllAuthData,
  saveParentSession,
  loadParentSession,
  clearParentSession,
  StoredUser,
  ParentSession,
  UserRole,
  storedUserIsMember,
  storedUserIsResponsibleOnly,
} from '@/utils/auth-storage';
import { getDeviceInfo } from '@/utils/device-info';
import { clearUserCache } from '@/utils/local-cache';

interface AuthContextType {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Role helpers
  isMember: boolean;
  isResponsibleOnly: boolean;
  // Privacy settings
  showInLeaderboard: boolean;
  // Profile switching
  isViewingAsChild: boolean;
  parentUser: StoredUser | null;
  children: Child[];
  childrenLoading: boolean;
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchToChild: (childId: string) => Promise<{ success: boolean; error?: string }>;
  switchBackToParent: () => Promise<{ success: boolean; error?: string }>;
  refreshChildren: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children: childrenProp }) => {
  const { tenant } = useTenant();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previousTenantSlug, setPreviousTenantSlug] = useState<string | null>(null);

  // Profile switching state
  const [isViewingAsChild, setIsViewingAsChild] = useState(false);
  const [parentUser, setParentUser] = useState<StoredUser | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

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

      const [storedToken, storedUser, storedParentSession] = await Promise.all([
        loadAuthToken(tenantSlug),
        loadUser(tenantSlug),
        loadParentSession(tenantSlug),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setApiAuthToken(storedToken);

        // Note: Reverb connection is now lazy - connects when user opens messages

        // Check if we're viewing as child (parent session exists)
        if (storedParentSession) {
          setIsViewingAsChild(true);
          setParentUser(storedParentSession.user);
        } else {
          setIsViewingAsChild(false);
          setParentUser(null);
        }
      } else {
        // No auth data for this tenant
        setToken(null);
        setUser(null);
        setApiAuthToken(null);
        setIsViewingAsChild(false);
        setParentUser(null);
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
      // Collect device info for login
      const device = await getDeviceInfo();
      const response = await authApi.login({ email, password, device });

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
        prefixedId: userData.prefixedId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        nickname: userData.nickname,
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

      // Note: Reverb connection is now lazy - connects when user opens messages

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  };

  /**
   * Handle unauthorized (401) response - clears local auth without calling API
   * This is called by the API client when a 401 is received
   */
  const handleUnauthorized = useCallback(async () => {
    console.log('[Auth] Handling 401 - clearing local auth data');

    // Disconnect Reverb
    reverbClient.disconnect();

    const tenantSlug = tenant?.slug || null;

    // Clear storage, state, and user-specific cache
    // Don't call logout API since we already got a 401
    await Promise.all([
      clearAllAuthData(tenantSlug),
      clearParentSession(tenantSlug),
      clearUserCache(),
    ]);

    setToken(null);
    setUser(null);
    setApiAuthToken(null);
    setOnUnauthorized(null); // Prevent re-triggering while clearing
    setIsViewingAsChild(false);
    setParentUser(null);
    setChildren([]);
  }, [tenant?.slug]);

  // Register 401 handler with API client
  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
    return () => setOnUnauthorized(null);
  }, [handleUnauthorized]);

  // Disconnect WebSocket when app goes to background
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const isGoingBackground = nextAppState === 'background' || nextAppState === 'inactive';

      // App going to background - disconnect to save resources
      if (isGoingBackground && appStateRef.current === 'active') {
        console.log('[Auth] App backgrounded, disconnecting Reverb');
        reverbClient.disconnect();
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const logout = async () => {
    try {
      // Call logout API
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Disconnect Reverb
      reverbClient.disconnect();

      const tenantSlug = tenant?.slug || null;
      // Clear storage, state, and user-specific cache for current tenant
      await Promise.all([
        clearAllAuthData(tenantSlug),
        clearParentSession(tenantSlug),
        clearUserCache(),
      ]);
      setToken(null);
      setUser(null);
      setApiAuthToken(null);
      setIsViewingAsChild(false);
      setParentUser(null);
      setChildren([]);
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

  /**
   * Fetch children, roles, and privacy settings from profile API
   */
  const refreshChildren = useCallback(async () => {
    if (!token || isViewingAsChild) {
      setChildren([]);
      return;
    }

    try {
      setChildrenLoading(true);

      // Fetch both profile and privacy settings in parallel
      const [profile, privacyResponse] = await Promise.all([
        getProfile(),
        user?.prefixedId
          ? api.get<{ data: { show_in_leaderboard: boolean } }>(`/users/${user.prefixedId}/profile`)
          : Promise.resolve(null),
      ]);

      // Handle null profile (API error/timeout)
      if (!profile) {
        console.log('[Auth] Could not fetch profile, keeping existing children');
        return;
      }

      setChildren(profile.children || []);

      // Update user data from profile if changed
      if (user) {
        const currentRoles = user.roles || [];
        const profileRoles = profile.roles || [];
        const rolesChanged =
          currentRoles.length !== profileRoles.length ||
          !currentRoles.every((r) => profileRoles.includes(r));

        // Get showInLeaderboard from privacy endpoint
        const showInLeaderboard = privacyResponse?.data?.data?.show_in_leaderboard ?? false;
        const leaderboardChanged = user.showInLeaderboard !== showInLeaderboard;

        if (rolesChanged || leaderboardChanged) {
          const updatedUser: StoredUser = {
            ...user,
            roles: profileRoles,
            showInLeaderboard,
          };
          setUser(updatedUser);
          const tenantSlug = tenant?.slug || null;
          await saveUser(updatedUser, tenantSlug);
        }
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
      // Keep existing children on error
    } finally {
      setChildrenLoading(false);
    }
  }, [token, isViewingAsChild, user, tenant?.slug]);

  /**
   * Refresh user profile (for updating privacy settings, etc.)
   */
  const refreshProfile = useCallback(async () => {
    if (!token || !user?.prefixedId) return;

    try {
      // Fetch privacy settings from the profile endpoint
      const response = await api.get<{ data: { show_in_leaderboard: boolean } }>(
        `/users/${user.prefixedId}/profile`
      );

      if (response.data?.data) {
        const updatedUser: StoredUser = {
          ...user,
          showInLeaderboard: response.data.data.show_in_leaderboard ?? false,
        };
        setUser(updatedUser);
        const tenantSlug = tenant?.slug || null;
        await saveUser(updatedUser, tenantSlug);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, [token, user, tenant?.slug]);

  // Fetch children when authenticated and not viewing as child
  useEffect(() => {
    if (token && !isLoading && !isViewingAsChild) {
      refreshChildren();
    }
  }, [token, isLoading, isViewingAsChild, refreshChildren]);

  /**
   * Switch to a child account
   */
  const switchToChild = async (childId: string): Promise<{ success: boolean; error?: string }> => {
    if (!token || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (isViewingAsChild) {
      return { success: false, error: 'Already viewing as child' };
    }

    try {
      const tenantSlug = tenant?.slug || null;
      const currentRefreshToken = await loadRefreshToken(tenantSlug);

      // Save current parent session before switching
      const parentSession: ParentSession = {
        token,
        refreshToken: currentRefreshToken || undefined,
        user,
      };
      await saveParentSession(parentSession, tenantSlug);

      // Clear user-specific cache before switching
      await clearUserCache();

      // Call switch API
      const result = await switchToChildApi(childId);

      // Prepare child user data (children are always members)
      const childUser: StoredUser = {
        id: result.user.id,
        prefixedId: result.user.prefixedId,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        nickname: result.user.nickname,
        roles: ['member'] as UserRole[],
      };

      // Save new auth data
      await Promise.all([saveAuthToken(result.token, tenantSlug), saveUser(childUser, tenantSlug)]);

      // Update state
      setToken(result.token);
      setUser(childUser);
      setApiAuthToken(result.token);
      setIsViewingAsChild(true);
      setParentUser(user);
      setChildren([]); // Children don't have children

      return { success: true };
    } catch (error) {
      console.error('Failed to switch to child:', error);
      // Rollback parent session on error
      const tenantSlug = tenant?.slug || null;
      await clearParentSession(tenantSlug);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to switch account',
      };
    }
  };

  /**
   * Switch back to parent account
   */
  const switchBackToParent = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isViewingAsChild) {
      return { success: false, error: 'Not viewing as child' };
    }

    try {
      const tenantSlug = tenant?.slug || null;
      const parentSession = await loadParentSession(tenantSlug);

      if (!parentSession) {
        return { success: false, error: 'No parent session found' };
      }

      // Clear user-specific cache and restore parent session
      await Promise.all([
        clearUserCache(),
        saveAuthToken(parentSession.token, tenantSlug),
        saveUser(parentSession.user, tenantSlug),
        parentSession.refreshToken
          ? saveRefreshToken(parentSession.refreshToken, tenantSlug)
          : Promise.resolve(),
        clearParentSession(tenantSlug),
      ]);

      // Update state
      setToken(parentSession.token);
      setUser(parentSession.user);
      setApiAuthToken(parentSession.token);
      setIsViewingAsChild(false);
      setParentUser(null);

      return { success: true };
    } catch (error) {
      console.error('Failed to switch back to parent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to switch back',
      };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    // Role helpers
    isMember: storedUserIsMember(user),
    isResponsibleOnly: storedUserIsResponsibleOnly(user),
    // Privacy settings
    showInLeaderboard: user?.showInLeaderboard ?? false,
    // Profile switching
    isViewingAsChild,
    parentUser,
    children,
    childrenLoading,
    // Actions
    login,
    logout,
    refreshSession,
    refreshProfile,
    switchToChild,
    switchBackToParent,
    refreshChildren,
  };

  return <AuthContext.Provider value={value}>{childrenProp}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
