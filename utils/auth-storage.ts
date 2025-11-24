import AsyncStorage from '@react-native-async-storage/async-storage';

// Base keys - will be combined with tenant slug
const AUTH_TOKEN_KEY = '@omoplata/auth_token';
const REFRESH_TOKEN_KEY = '@omoplata/refresh_token';
const USER_KEY = '@omoplata/user';

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  membershipId?: string;
}

/**
 * Get tenant-specific key for storage
 */
const getTenantKey = (baseKey: string, tenantSlug: string | null): string => {
  if (!tenantSlug) {
    return baseKey;
  }
  return `${baseKey}:${tenantSlug}`;
};

/**
 * Save authentication token to persistent storage (per tenant)
 */
export const saveAuthToken = async (
  token: string,
  tenantSlug: string | null = null
): Promise<void> => {
  try {
    const key = getTenantKey(AUTH_TOKEN_KEY, tenantSlug);
    await AsyncStorage.setItem(key, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
    throw error;
  }
};

/**
 * Load authentication token from persistent storage (per tenant)
 */
export const loadAuthToken = async (tenantSlug: string | null = null): Promise<string | null> => {
  try {
    const key = getTenantKey(AUTH_TOKEN_KEY, tenantSlug);
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Failed to load auth token:', error);
    return null;
  }
};

/**
 * Clear authentication token from storage (per tenant)
 */
export const clearAuthToken = async (tenantSlug: string | null = null): Promise<void> => {
  try {
    const key = getTenantKey(AUTH_TOKEN_KEY, tenantSlug);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
    throw error;
  }
};

/**
 * Save refresh token to persistent storage (per tenant)
 */
export const saveRefreshToken = async (
  refreshToken: string,
  tenantSlug: string | null = null
): Promise<void> => {
  try {
    const key = getTenantKey(REFRESH_TOKEN_KEY, tenantSlug);
    await AsyncStorage.setItem(key, refreshToken);
  } catch (error) {
    console.error('Failed to save refresh token:', error);
    throw error;
  }
};

/**
 * Load refresh token from persistent storage (per tenant)
 */
export const loadRefreshToken = async (
  tenantSlug: string | null = null
): Promise<string | null> => {
  try {
    const key = getTenantKey(REFRESH_TOKEN_KEY, tenantSlug);
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Failed to load refresh token:', error);
    return null;
  }
};

/**
 * Clear refresh token from storage (per tenant)
 */
export const clearRefreshToken = async (tenantSlug: string | null = null): Promise<void> => {
  try {
    const key = getTenantKey(REFRESH_TOKEN_KEY, tenantSlug);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear refresh token:', error);
    throw error;
  }
};

/**
 * Save user data to persistent storage (per tenant)
 */
export const saveUser = async (
  user: StoredUser,
  tenantSlug: string | null = null
): Promise<void> => {
  try {
    const key = getTenantKey(USER_KEY, tenantSlug);
    await AsyncStorage.setItem(key, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user:', error);
    throw error;
  }
};

/**
 * Load user data from persistent storage (per tenant)
 */
export const loadUser = async (tenantSlug: string | null = null): Promise<StoredUser | null> => {
  try {
    const key = getTenantKey(USER_KEY, tenantSlug);
    const userJson = await AsyncStorage.getItem(key);
    if (!userJson) {
      return null;
    }
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Failed to load user:', error);
    return null;
  }
};

/**
 * Clear user data from storage (per tenant)
 */
export const clearUser = async (tenantSlug: string | null = null): Promise<void> => {
  try {
    const key = getTenantKey(USER_KEY, tenantSlug);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear user:', error);
    throw error;
  }
};

/**
 * Clear all authentication data for a specific tenant
 */
export const clearAllAuthData = async (tenantSlug: string | null = null): Promise<void> => {
  try {
    await Promise.all([
      clearAuthToken(tenantSlug),
      clearRefreshToken(tenantSlug),
      clearUser(tenantSlug),
    ]);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
    throw error;
  }
};

/**
 * Clear all authentication data for ALL tenants
 * Useful when completely logging out or resetting the app
 */
export const clearAllTenantsAuthData = async (): Promise<void> => {
  try {
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();

    // Filter keys that are auth-related
    const authKeys = allKeys.filter(
      (key) =>
        key.startsWith(AUTH_TOKEN_KEY) ||
        key.startsWith(REFRESH_TOKEN_KEY) ||
        key.startsWith(USER_KEY)
    );

    // Remove all auth keys
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
    }
  } catch (error) {
    console.error('Failed to clear all tenants auth data:', error);
    throw error;
  }
};
