import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import {
  AppConfigProvider,
  useAppConfig,
  useMembershipSettings,
  useBillingSettings,
  useFeatureFlags,
} from '../../contexts/AppConfigContext';

// Mock the TenantContext
jest.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    tenant: { slug: 'test-tenant', name: 'Test Tenant', domain: 'test.example.com' },
    isLoading: false,
    isTenantRequired: false,
  }),
}));

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { id: 'test-user', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock the app-config API
jest.mock('../../api/app-config', () => ({
  clearConfigCache: jest.fn(() => Promise.resolve()),
  getAppConfig: jest.fn(() =>
    Promise.resolve({
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
    })
  ),
  defaultConfig: {
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
  },
}));

// Create test components
function TestAppConfigComponent() {
  const config = useAppConfig();
  return <Text testID="config-data">{JSON.stringify(config)}</Text>;
}

function TestMembershipSettingsComponent() {
  const settings = useMembershipSettings();
  return <Text testID="membership-settings">{JSON.stringify(settings)}</Text>;
}

function TestBillingSettingsComponent() {
  const settings = useBillingSettings();
  return <Text testID="billing-settings">{JSON.stringify(settings)}</Text>;
}

function TestFeatureFlagsComponent() {
  const flags = useFeatureFlags();
  return <Text testID="feature-flags">{JSON.stringify(flags)}</Text>;
}

describe('AppConfigContext', () => {
  describe('AppConfigProvider', () => {
    it('should provide app config to children', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestAppConfigComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const configElement = getByTestId('config-data');
        const config = JSON.parse(configElement.props.children);

        expect(config).toBeDefined();
        expect(config.membership).toBeDefined();
        expect(config.billing).toBeDefined();
        expect(config.features).toBeDefined();
        // Navigation may be undefined initially but other configs should be present
        expect(config.membership.allowPause).toBeDefined();
      });
    });

    it('should load config on mount', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestAppConfigComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const configElement = getByTestId('config-data');
        expect(configElement).toBeTruthy();
      });
    });
  });

  describe('useMembershipSettings', () => {
    it('should provide membership settings', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestMembershipSettingsComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const settingsElement = getByTestId('membership-settings');
        const settings = JSON.parse(settingsElement.props.children);

        expect(settings).toBeDefined();
        expect(settings.allowPause).toBeDefined();
        expect(settings.allowPlanChange).toBeDefined();
        expect(settings.allowGuestPasses).toBeDefined();
        expect(settings.showContractDownload).toBeDefined();
      });
    });

    it('should have default values for membership settings', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestMembershipSettingsComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const settingsElement = getByTestId('membership-settings');
        const settings = JSON.parse(settingsElement.props.children);

        expect(settings.allowPause).toBe(true);
        expect(settings.cancellationNoticeDays).toBe(30);
      });
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestMembershipSettingsComponent />);
      }).toThrow('useAppConfig must be used within AppConfigProvider');

      consoleError.mockRestore();
    });
  });

  describe('useBillingSettings', () => {
    it('should provide billing settings', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestBillingSettingsComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const settingsElement = getByTestId('billing-settings');
        const settings = JSON.parse(settingsElement.props.children);

        expect(settings).toBeDefined();
        expect(settings.allowPaymentMethodChange).toBeDefined();
        expect(settings.allowAutoPay).toBeDefined();
        expect(settings.showInvoiceHistory).toBeDefined();
        expect(settings.allowOneTimePayments).toBeDefined();
      });
    });

    it('should have default values for billing settings', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestBillingSettingsComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const settingsElement = getByTestId('billing-settings');
        const settings = JSON.parse(settingsElement.props.children);

        expect(settings.allowPaymentMethodChange).toBe(true);
        expect(settings.allowAutoPay).toBe(true);
        expect(settings.showInvoiceHistory).toBe(true);
        expect(settings.allowOneTimePayments).toBe(true);
      });
    });
  });

  describe('useFeatureFlags', () => {
    it('should provide feature flags', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestFeatureFlagsComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const flagsElement = getByTestId('feature-flags');
        const flags = JSON.parse(flagsElement.props.children);

        expect(flags).toBeDefined();
        expect(flags.checkInEnabled).toBeDefined();
        expect(flags.notificationsEnabled).toBeDefined();
        expect(flags.classBookingEnabled).toBeDefined();
        expect(flags.socialSharingEnabled).toBeDefined();
        expect(flags.referralProgramEnabled).toBeDefined();
        expect(flags.membershipCancellationEnabled).toBeDefined();
      });
    });

    it('should have default values for feature flags', async () => {
      const { getByTestId } = render(
        <AppConfigProvider>
          <TestFeatureFlagsComponent />
        </AppConfigProvider>
      );

      await waitFor(() => {
        const flagsElement = getByTestId('feature-flags');
        const flags = JSON.parse(flagsElement.props.children);

        expect(flags.checkInEnabled).toBe(true);
        expect(flags.notificationsEnabled).toBe(true);
        expect(flags.classBookingEnabled).toBe(true);
        expect(flags.socialSharingEnabled).toBe(false);
        expect(flags.referralProgramEnabled).toBe(false);
        expect(flags.membershipCancellationEnabled).toBe(true);
      });
    });
  });
});
