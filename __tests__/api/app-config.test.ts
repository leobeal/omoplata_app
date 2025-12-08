import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getAppConfig,
  getMembershipSettings,
  getBillingSettings,
  getFeatureFlags,
  getCachedConfig,
  cacheConfig,
  clearConfigCache,
  refreshAppConfig,
  defaultConfig,
  AppConfig,
} from '../../api/app-config';
import api from '../../api/client';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock API client
jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockApiResponse: AppConfig = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  navigation: { tabs: ['index', 'membership', 'billing', 'settings'] },
  membership: defaultConfig.membership!,
  billing: defaultConfig.billing!,
  features: defaultConfig.features!,
  analytics: defaultConfig.analytics!,
};

describe('App Config API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    // Default mock for successful API response
    (api.get as jest.Mock).mockResolvedValue({
      data: mockApiResponse,
      error: null,
      status: 200,
    });
  });

  describe('getAppConfig', () => {
    it('should fetch config from API when no cache exists', async () => {
      const result = await getAppConfig();

      expect(result.config).toBeDefined();
      expect(result.config?.navigation).toBeDefined();
      expect(result.config?.membership).toBeDefined();
      expect(result.config?.billing).toBeDefined();
      expect(result.config?.features).toBeDefined();
      expect(result.error).toBeNull();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should use cached config when available and valid', async () => {
      const cachedConfig = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        navigation: {
          tabs: [],
          showCheckInButton: true,
        },
        membership: defaultConfig.membership!,
        billing: defaultConfig.billing!,
        features: defaultConfig.features!,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedConfig));

      const result = await getAppConfig();

      expect(result.config).toEqual(cachedConfig);
      expect(result.error).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_config');
    });

    it('should fetch new config if cache is expired', async () => {
      const expiredConfig = {
        version: '1.0.0',
        lastUpdated: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        navigation: { tabs: [], showCheckInButton: true },
        membership: defaultConfig.membership!,
        billing: defaultConfig.billing!,
        features: defaultConfig.features!,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(expiredConfig));

      const result = await getAppConfig();

      expect(result.config).toBeDefined();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_config');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      // Also mock API to fail so we can test the error path
      (api.get as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await getAppConfig();

      // When both storage and API fail, we get network_error
      expect(result.error).toBe('network_error');
    });

    it('should return club_not_found error on 404', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: null,
        error: 'Not found',
        status: 404,
      });

      const result = await getAppConfig();

      expect(result.config).toBeNull();
      expect(result.error).toBe('club_not_found');
    });
  });

  describe('getMembershipSettings', () => {
    it('should return membership settings from config', async () => {
      const settings = await getMembershipSettings();

      expect(settings).toBeDefined();
      expect(settings.allowPause).toBeDefined();
      expect(settings.allowPlanChange).toBeDefined();
      expect(settings.allowGuestPasses).toBeDefined();
      expect(settings.showContractDownload).toBeDefined();
    });

    it('should return default settings on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Error'));

      const settings = await getMembershipSettings();

      expect(settings).toEqual(defaultConfig.membership);
    });

    it('should have correct default values', async () => {
      const settings = await getMembershipSettings();

      expect(settings.allowPause).toBe(true);
      expect(settings.allowPlanChange).toBe(true);
      expect(settings.allowGuestPasses).toBe(true);
      expect(settings.showContractDownload).toBe(true);
      expect(settings.cancellationNoticeDays).toBe(30);
    });
  });

  describe('getBillingSettings', () => {
    it('should return billing settings from config', async () => {
      const settings = await getBillingSettings();

      expect(settings).toBeDefined();
      expect(settings.allowPaymentMethodChange).toBeDefined();
      expect(settings.allowAutoPay).toBeDefined();
      expect(settings.showInvoiceHistory).toBeDefined();
      expect(settings.allowOneTimePayments).toBeDefined();
    });

    it('should return default settings on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Error'));

      const settings = await getBillingSettings();

      expect(settings).toEqual(defaultConfig.billing);
    });

    it('should have correct default values', async () => {
      const settings = await getBillingSettings();

      expect(settings.allowPaymentMethodChange).toBe(true);
      expect(settings.allowAutoPay).toBe(true);
      expect(settings.showInvoiceHistory).toBe(true);
      expect(settings.allowOneTimePayments).toBe(true);
    });
  });

  describe('getFeatureFlags', () => {
    it('should return feature flags from config', async () => {
      const flags = await getFeatureFlags();

      expect(flags).toBeDefined();
      expect(flags.checkInEnabled).toBeDefined();
      expect(flags.notificationsEnabled).toBeDefined();
      expect(flags.classBookingEnabled).toBeDefined();
      expect(flags.socialSharingEnabled).toBeDefined();
      expect(flags.referralProgramEnabled).toBeDefined();
      expect(flags.membershipCancellationEnabled).toBeDefined();
    });

    it('should return default flags on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Error'));

      const flags = await getFeatureFlags();

      expect(flags).toEqual(defaultConfig.features);
    });

    it('should have correct default values', async () => {
      const flags = await getFeatureFlags();

      expect(flags.checkInEnabled).toBe(true);
      expect(flags.notificationsEnabled).toBe(true);
      expect(flags.classBookingEnabled).toBe(true);
      expect(flags.socialSharingEnabled).toBe(false);
      expect(flags.referralProgramEnabled).toBe(false);
      expect(flags.membershipCancellationEnabled).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should cache config after fetching', async () => {
      await getAppConfig();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_config', expect.any(String));
    });

    it('should clear cache', async () => {
      await clearConfigCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_config');
    });

    it('should refresh config by clearing cache and fetching new', async () => {
      const result = await refreshAppConfig();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_config');
      expect(result.config).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Cache error'));

      // cacheConfig silently fails on errors (by design), so we just verify it doesn't throw
      await expect(
        cacheConfig({
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          navigation: { tabs: [] },
          membership: defaultConfig.membership!,
          billing: defaultConfig.billing!,
          features: defaultConfig.features!,
          analytics: defaultConfig.analytics!,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Config Structure', () => {
    it('should return config with all required sections', async () => {
      const result = await getAppConfig();

      expect(result.config).toHaveProperty('navigation');
      expect(result.config).toHaveProperty('membership');
      expect(result.config).toHaveProperty('billing');
      expect(result.config).toHaveProperty('features');
      expect(result.config).toHaveProperty('version');
      expect(result.config).toHaveProperty('lastUpdated');
    });

    it('should have valid navigation config', async () => {
      const result = await getAppConfig();

      expect(result.config?.navigation.tabs).toBeDefined();
      expect(Array.isArray(result.config?.navigation.tabs)).toBe(true);
    });
  });
});
