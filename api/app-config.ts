import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationConfig } from '@/configs/navigation';

const CACHE_KEY = 'app_navigation_config';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface AppConfig {
  navigation: NavigationConfig;
  version: string;
  lastUpdated: string;
}

/**
 * Fetch navigation configuration from the API
 * In production, this would call your backend API
 */
export const fetchNavigationConfig = async (): Promise<AppConfig> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In production, replace this with actual API call:
  // const response = await fetch(`${API_BASE_URL}/config/navigation`);
  // const data = await response.json();
  // return data;

  // For now, return dummy data from local file
  const configData = require('../data/app-config.json');
  return configData;
};

/**
 * Get cached navigation config from AsyncStorage
 */
export const getCachedConfig = async (): Promise<AppConfig | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    if (!cachedData) {
      return null;
    }

    const parsed = JSON.parse(cachedData);
    const cacheAge = Date.now() - new Date(parsed.lastUpdated).getTime();

    // Check if cache is still valid
    if (cacheAge < CACHE_DURATION) {
      return parsed;
    }

    // Cache expired, remove it
    await AsyncStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading cached config:', error);
    return null;
  }
};

/**
 * Save navigation config to cache
 */
export const cacheConfig = async (config: AppConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error caching config:', error);
  }
};

/**
 * Get navigation config with caching
 * 1. Try to get from cache
 * 2. If no cache or expired, fetch from API
 * 3. Cache the new config
 * 4. Return the config
 */
export const getNavigationConfig = async (): Promise<NavigationConfig | null> => {
  try {
    // Try cache first
    const cached = await getCachedConfig();
    if (cached) {
      console.log('Using cached navigation config');
      return cached.navigation;
    }

    // Fetch from API
    console.log('Fetching navigation config from API');
    const config = await fetchNavigationConfig();

    // Cache it
    await cacheConfig(config);

    return config.navigation;
  } catch (error) {
    console.error('Error getting navigation config:', error);
    return null;
  }
};

/**
 * Clear cached config (useful for testing or forcing refresh)
 */
export const clearConfigCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('Config cache cleared');
  } catch (error) {
    console.error('Error clearing config cache:', error);
  }
};

/**
 * Force refresh config from API
 */
export const refreshNavigationConfig = async (): Promise<NavigationConfig | null> => {
  await clearConfigCache();
  return getNavigationConfig();
};
