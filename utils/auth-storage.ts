import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@omoplata/auth_token';
const REFRESH_TOKEN_KEY = '@omoplata/refresh_token';
const USER_KEY = '@omoplata/user';

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  membershipId?: string;
}

/**
 * Save authentication token to persistent storage
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
    throw error;
  }
};

/**
 * Load authentication token from persistent storage
 */
export const loadAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to load auth token:', error);
    return null;
  }
};

/**
 * Clear authentication token from storage
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
    throw error;
  }
};

/**
 * Save refresh token to persistent storage
 */
export const saveRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Failed to save refresh token:', error);
    throw error;
  }
};

/**
 * Load refresh token from persistent storage
 */
export const loadRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to load refresh token:', error);
    return null;
  }
};

/**
 * Clear refresh token from storage
 */
export const clearRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear refresh token:', error);
    throw error;
  }
};

/**
 * Save user data to persistent storage
 */
export const saveUser = async (user: StoredUser): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user:', error);
    throw error;
  }
};

/**
 * Load user data from persistent storage
 */
export const loadUser = async (): Promise<StoredUser | null> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
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
 * Clear user data from storage
 */
export const clearUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to clear user:', error);
    throw error;
  }
};

/**
 * Clear all authentication data
 */
export const clearAllAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      clearAuthToken(),
      clearRefreshToken(),
      clearUser(),
    ]);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
    throw error;
  }
};
