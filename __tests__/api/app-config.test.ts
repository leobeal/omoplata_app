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
} from '../../api/app-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('App Config API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getAppConfig', () => {
    it('should fetch config from API when no cache exists', async () => {
      const config = await getAppConfig();

      expect(config).toBeDefined();
      expect(config?.navigation).toBeDefined();
      expect(config?.membership).toBeDefined();
      expect(config?.billing).toBeDefined();
      expect(config?.features).toBeDefined();
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

      const config = await getAppConfig();

      expect(config).toEqual(cachedConfig);
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

      const config = await getAppConfig();

      expect(config).toBeDefined();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_config');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const config = await getAppConfig();

      expect(config).toBeDefined();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('getMembershipSettings', () => {
    it('should return membership settings from config', async () => {
      const settings = await getMembershipSettings();

      expect(settings).toBeDefined();
      expect(settings.allowPause).toBeDefined();
      expect(settings.allowFreeze).toBeDefined();
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
      expect(settings.allowFreeze).toBe(true);
      expect(settings.allowPlanChange).toBe(true);
      expect(settings.allowGuestPasses).toBe(true);
      expect(settings.showContractDownload).toBe(true);
      expect(settings.cancellationNoticeDays).toBe(30);
      expect(settings.maxFreezeDaysPerYear).toBe(90);
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
      expect(flags.qrCheckInEnabled).toBeDefined();
      expect(flags.notificationsEnabled).toBeDefined();
      expect(flags.classBookingEnabled).toBeDefined();
      expect(flags.socialSharingEnabled).toBeDefined();
      expect(flags.referralProgramEnabled).toBeDefined();
    });

    it('should return default flags on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Error'));

      const flags = await getFeatureFlags();

      expect(flags).toEqual(defaultConfig.features);
    });

    it('should have correct default values', async () => {
      const flags = await getFeatureFlags();

      expect(flags.checkInEnabled).toBe(true);
      expect(flags.qrCheckInEnabled).toBe(true);
      expect(flags.notificationsEnabled).toBe(true);
      expect(flags.classBookingEnabled).toBe(true);
      expect(flags.socialSharingEnabled).toBe(false);
      expect(flags.referralProgramEnabled).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should cache config after fetching', async () => {
      await getAppConfig();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_config',
        expect.any(String)
      );
    });

    it('should clear cache', async () => {
      await clearConfigCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_config');
    });

    it('should refresh config by clearing cache and fetching new', async () => {
      const config = await refreshAppConfig();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_config');
      expect(config).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Cache error'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const config = await cacheConfig({
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        navigation: { tabs: [], showCheckInButton: true },
        membership: defaultConfig.membership!,
        billing: defaultConfig.billing!,
        features: defaultConfig.features!,
      });

      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Config Structure', () => {
    it('should return config with all required sections', async () => {
      const config = await getAppConfig();

      expect(config).toHaveProperty('navigation');
      expect(config).toHaveProperty('membership');
      expect(config).toHaveProperty('billing');
      expect(config).toHaveProperty('features');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('lastUpdated');
    });

    it('should have valid navigation config', async () => {
      const config = await getAppConfig();

      expect(config?.navigation.tabs).toBeDefined();
      expect(Array.isArray(config?.navigation.tabs)).toBe(true);
      expect(config?.navigation.showCheckInButton).toBeDefined();
    });
  });
});
