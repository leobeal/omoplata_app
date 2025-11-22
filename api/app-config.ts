import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'app_config';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Navigation configuration from API
 * Only specifies which tabs to show, not their full configuration
 */
export interface NavigationConfig {
  tabs: string[]; // Array of tab names to show (e.g., ["index", "membership", "billing", "settings"])
  showCheckInButton?: boolean;
}

export interface MembershipSettings {
  allowPause: boolean;
  allowFreeze: boolean;
  allowPlanChange: boolean;
  allowGuestPasses: boolean;
  showContractDownload: boolean;
  cancellationNoticeDays?: number; // e.g., 30 days notice required
  maxFreezeDaysPerYear?: number; // e.g., 90 days
}

export interface BillingSettings {
  allowPaymentMethodChange: boolean;
  allowAutoPay: boolean;
  showInvoiceHistory: boolean;
  allowOneTimePayments: boolean;
}

export interface FeatureFlags {
  checkInEnabled: boolean;
  qrCheckInEnabled: boolean;
  notificationsEnabled: boolean;
  classBookingEnabled: boolean;
  socialSharingEnabled: boolean;
  referralProgramEnabled: boolean;
  membershipCancellationEnabled: boolean;
}

export interface AppConfig {
  navigation: NavigationConfig;
  membership: MembershipSettings;
  billing: BillingSettings;
  features: FeatureFlags;
  version: string;
  lastUpdated: string;
}

/**
 * Default configuration fallback
 */
export const defaultConfig: Partial<AppConfig> = {
  membership: {
    allowPause: true,
    allowFreeze: true,
    allowPlanChange: true,
    allowGuestPasses: true,
    showContractDownload: true,
    cancellationNoticeDays: 30,
    maxFreezeDaysPerYear: 90,
  },
  billing: {
    allowPaymentMethodChange: true,
    allowAutoPay: true,
    showInvoiceHistory: true,
    allowOneTimePayments: true,
  },
  features: {
    checkInEnabled: true,
    qrCheckInEnabled: true,
    notificationsEnabled: true,
    classBookingEnabled: true,
    socialSharingEnabled: false,
    referralProgramEnabled: false,
    membershipCancellationEnabled: true,
  },
};

/**
 * Fetch app configuration from the API
 * In production, this would call your backend API
 */
export const fetchAppConfig = async (): Promise<AppConfig> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In production, replace this with actual API call:
  // const response = await fetch(`${API_BASE_URL}/config/app`);
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
