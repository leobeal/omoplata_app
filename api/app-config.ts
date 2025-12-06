import AsyncStorage from '@react-native-async-storage/async-storage';

import api from './client';
import { ENDPOINTS } from './config';

const CACHE_KEY = 'app_config';
const CACHE_DURATION = 5; //TODO change in prod

/**
 * Convert snake_case keys to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform snake_case object to camelCase
 */
function transformToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformToCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = transformToCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

/**
 * Navigation configuration from API
 * Only specifies which tabs to show, not their full configuration
 */
export interface NavigationConfig {
  tabs: string[]; // Array of tab names to show (e.g., ["index", "membership", "billing", "settings"])
}

export interface MembershipSettings {
  allowPause: boolean;
  allowPlanChange: boolean;
  allowGuestPasses: boolean;
  showContractDownload: boolean;
  cancellationNoticeDays?: number; // e.g., 30 days notice required
}

export interface BillingSettings {
  allowPaymentMethodChange: boolean;
  allowAutoPay: boolean;
  showInvoiceHistory: boolean;
  allowOneTimePayments: boolean;
}

export interface FeatureFlags {
  checkInEnabled: boolean; // Controls both check-in feature and navigation button visibility
  notificationsEnabled: boolean;
  classBookingEnabled: boolean;
  socialSharingEnabled: boolean;
  referralProgramEnabled: boolean;
  membershipCancellationEnabled: boolean;
}

export interface AnalyticsSettings {
  aggregationPeriod: 'daily' | 'weekly'; // daily = last 7 days, weekly = last 4 weeks
}

export interface AppConfig {
  navigation: NavigationConfig;
  membership: MembershipSettings;
  billing: BillingSettings;
  features: FeatureFlags;
  analytics: AnalyticsSettings;
  version: string;
  lastUpdated: string;
}

/**
 * Default configuration fallback
 */
export const defaultConfig: Partial<AppConfig> = {
  membership: {
    allowPause: true,
    allowPlanChange: true,
    allowGuestPasses: true,
    showContractDownload: true,
    cancellationNoticeDays: 30,
  },
  billing: {
    allowPaymentMethodChange: true,
    allowAutoPay: true,
    showInvoiceHistory: true,
    allowOneTimePayments: true,
  },
  features: {
    checkInEnabled: true,
    notificationsEnabled: true,
    classBookingEnabled: true,
    socialSharingEnabled: false,
    referralProgramEnabled: false,
    membershipCancellationEnabled: true,
  },
  analytics: {
    aggregationPeriod: 'daily', // Default to daily (last 7 days)
  },
};

/**
 * Fetch app configuration from the API
 * Falls back to local data if API fails
 */
export const fetchAppConfig = async (): Promise<AppConfig> => {
  try {
    const response = await api.get<Record<string, unknown>>(ENDPOINTS.CONFIG.APP);

    if (response.data) {
      console.log('[AppConfig] Fetched from remote API');
      return transformToCamelCase(response.data) as AppConfig;
    }

    // API returned no data, fall back to local
    console.warn('[AppConfig] API returned no data, using local fallback');
    const configData = require('../data/app-config.json');
    return transformToCamelCase(configData) as AppConfig;
  } catch (error) {
    // API failed, fall back to local data
    console.warn('[AppConfig] API fetch failed, using local fallback:', error);
    const configData = require('../data/app-config.json');
    return transformToCamelCase(configData) as AppConfig;
  }
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
 * Get full app config with caching
 * 1. Try to get from cache
 * 2. If no cache or expired, fetch from API
 * 3. Cache the new config
 * 4. Return the config
 */
export const getAppConfig = async (): Promise<AppConfig | null> => {
  try {
    // Try cache first
    const cached = await getCachedConfig();
    if (cached) {
      console.log('Using cached app config');
      return cached;
    }

    // Fetch from API
    console.log('Fetching app config from API');
    const config = await fetchAppConfig();

    // Cache it
    await cacheConfig(config);

    return config;
  } catch (error) {
    console.error('Error getting app config:', error);
    return null;
  }
};

/**
 * Get navigation config with caching (backward compatibility)
 * 1. Try to get from cache
 * 2. If no cache or expired, fetch from API
 * 3. Cache the new config
 * 4. Return the config
 */
export const getNavigationConfig = async (): Promise<NavigationConfig | null> => {
  try {
    const config = await getAppConfig();
    return config?.navigation || null;
  } catch (error) {
    console.error('Error getting navigation config:', error);
    return null;
  }
};

/**
 * Get membership settings from config
 */
export const getMembershipSettings = async (): Promise<MembershipSettings> => {
  try {
    const config = await getAppConfig();
    return config?.membership || defaultConfig.membership!;
  } catch (error) {
    console.error('Error getting membership settings:', error);
    return defaultConfig.membership!;
  }
};

/**
 * Get billing settings from config
 */
export const getBillingSettings = async (): Promise<BillingSettings> => {
  try {
    const config = await getAppConfig();
    return config?.billing || defaultConfig.billing!;
  } catch (error) {
    console.error('Error getting billing settings:', error);
    return defaultConfig.billing!;
  }
};

/**
 * Get feature flags from config
 */
export const getFeatureFlags = async (): Promise<FeatureFlags> => {
  try {
    const config = await getAppConfig();
    return config?.features || defaultConfig.features!;
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return defaultConfig.features!;
  }
};

/**
 * Get analytics settings from config
 */
export const getAnalyticsSettings = async (): Promise<AnalyticsSettings> => {
  try {
    const config = await getAppConfig();
    return config?.analytics || defaultConfig.analytics!;
  } catch (error) {
    console.error('Error getting analytics settings:', error);
    return defaultConfig.analytics!;
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
export const refreshAppConfig = async (): Promise<AppConfig | null> => {
  await clearConfigCache();
  return getAppConfig();
};
