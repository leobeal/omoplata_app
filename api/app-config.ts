import AsyncStorage from '@react-native-async-storage/async-storage';

import api from './client';
import { ENDPOINTS } from './config';

const CACHE_KEY = 'app_config';
const CACHE_DURATION_MS = 1; // 24 hours in milliseconds

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

// Error types for app config fetching
export type AppConfigErrorType = 'club_not_found' | 'network_error' | null;

export interface AppConfigResult {
  config: AppConfig | null;
  error: AppConfigErrorType;
}

/**
 * Fetch app configuration from the API
 * Returns error type if club not found (404) or network error
 */
export const fetchAppConfig = async (): Promise<AppConfigResult> => {
  try {
    const response = await api.get<Record<string, unknown>>(ENDPOINTS.CONFIG.APP);

    // Check for 404 - club not found
    if (response.status === 404) {
      console.error('[AppConfig] Club not found (404)');
      return { config: null, error: 'club_not_found' };
    }

    // Check if we have data (could be empty object, so check for actual content)
    if (response.data && Object.keys(response.data).length > 0) {
      console.log('[AppConfig] Fetched from remote API');
      return {
        config: transformToCamelCase(response.data) as AppConfig,
        error: null,
      };
    }

    // API returned no data or empty object
    return { config: null, error: 'network_error' };
  } catch {
    // API failed - network error
    return { config: null, error: 'network_error' };
  }
};

/**
 * Get cached navigation config from AsyncStorage
 * @param allowStale - If true, returns expired cache for offline fallback
 */
export const getCachedConfig = async (
  allowStale: boolean = false
): Promise<{ config: AppConfig | null; isStale: boolean }> => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    if (!cachedData) {
      return { config: null, isStale: false };
    }

    const parsed = JSON.parse(cachedData);
    const cacheAge = Date.now() - new Date(parsed.lastUpdated).getTime();
    const isStale = cacheAge >= CACHE_DURATION_MS;

    // Check if cache is still valid
    if (!isStale) {
      return { config: parsed, isStale: false };
    }

    // Cache expired
    if (allowStale) {
      console.log('[AppConfig] Using stale cache for offline fallback');
      return { config: parsed, isStale: true };
    }

    // Remove expired cache if not allowing stale
    await AsyncStorage.removeItem(CACHE_KEY);
    return { config: null, isStale: false };
  } catch {
    return { config: null, isStale: false };
  }
};

/**
 * Save navigation config to cache
 */
export const cacheConfig = async (config: AppConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
  } catch {
    // Silently fail - caching is not critical
  }
};

/**
 * Get full app config with caching
 * 1. Try to get from cache
 * 2. If no cache or expired, fetch from API
 * 3. Cache the new config
 * 4. Return the config with error type
 * 5. If API fails and we have stale cache, use it (offline fallback)
 */
export const getAppConfig = async (): Promise<AppConfigResult & { isStale?: boolean }> => {
  try {
    // Try fresh cache first
    const { config: cached, isStale } = await getCachedConfig(false);
    if (cached && !isStale) {
      console.log('[AppConfig] Using fresh cached config');
      return { config: cached, error: null, isStale: false };
    }

    // Fetch from API
    console.log('[AppConfig] Fetching from API');
    const result = await fetchAppConfig();

    // Only cache if successful
    if (result.config) {
      await cacheConfig(result.config);
      return { ...result, isStale: false };
    }

    // API failed - try stale cache as fallback (offline mode)
    const { config: staleCache } = await getCachedConfig(true);
    if (staleCache) {
      console.log('[AppConfig] API failed, using stale cache as offline fallback');
      return { config: staleCache, error: null, isStale: true };
    }

    return { ...result, isStale: false };
  } catch {
    // Try stale cache as last resort
    const { config: staleCache } = await getCachedConfig(true);
    if (staleCache) {
      return { config: staleCache, error: null, isStale: true };
    }

    return { config: null, error: 'network_error', isStale: false };
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
    const result = await getAppConfig();
    return result.config?.navigation || null;
  } catch {
    return null;
  }
};

/**
 * Get membership settings from config
 */
export const getMembershipSettings = async (): Promise<MembershipSettings> => {
  try {
    const result = await getAppConfig();
    return result.config?.membership || defaultConfig.membership!;
  } catch {
    return defaultConfig.membership!;
  }
};

/**
 * Get billing settings from config
 */
export const getBillingSettings = async (): Promise<BillingSettings> => {
  try {
    const result = await getAppConfig();
    return result.config?.billing || defaultConfig.billing!;
  } catch {
    return defaultConfig.billing!;
  }
};

/**
 * Get feature flags from config
 */
export const getFeatureFlags = async (): Promise<FeatureFlags> => {
  try {
    const result = await getAppConfig();
    return result.config?.features || defaultConfig.features!;
  } catch {
    return defaultConfig.features!;
  }
};

/**
 * Get analytics settings from config
 */
export const getAnalyticsSettings = async (): Promise<AnalyticsSettings> => {
  try {
    const result = await getAppConfig();
    return result.config?.analytics || defaultConfig.analytics!;
  } catch {
    return defaultConfig.analytics!;
  }
};

/**
 * Clear cached config (useful for testing or forcing refresh)
 */
export const clearConfigCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // Silently fail
  }
};

/**
 * Force refresh config from API
 */
export const refreshAppConfig = async (): Promise<AppConfigResult> => {
  await clearConfigCache();
  return getAppConfig();
};
