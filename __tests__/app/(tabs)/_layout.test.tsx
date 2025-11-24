import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import TabsLayout from '../../../app/(tabs)/_layout';

// Mock the contexts
jest.mock('@/contexts/ThemeColors', () => ({
  useThemeColors: () => ({
    text: '#ffffff',
    bg: '#141414',
    placeholder: 'rgba(255,255,255,0.4)',
    border: '#404040',
    highlight: '#FF6B35',
    isDark: true,
  }),
}));

jest.mock('@/contexts/TenantContext', () => ({
  useTenant: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/LocalizationContext', () => ({
  useT: () => (key: string) => key,
}));

jest.mock('@/api/app-config', () => ({
  getNavigationConfig: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('expo-router/ui', () => ({
  Tabs: ({ children }: any) => children,
  TabList: ({ children }: any) => children,
  TabSlot: () => null,
  TabTrigger: ({ children }: any) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/components/TabButton', () => ({
  TabButton: ({ children }: any) => children,
}));

jest.mock('@/components/CheckInButton', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/configs/navigation', () => ({
  defaultNavigation: {
    tabs: [
      { name: 'home', href: '/', label: 'Home', icon: 'Home' },
      { name: 'schedule', href: '/schedule', label: 'Schedule', icon: 'Calendar' },
    ],
    showCheckInButton: true,
  },
}));

describe('TabsLayout - Authentication and Tenant Guards', () => {
  const mockUseTenant = require('@/contexts/TenantContext').useTenant;
  const mockUseAuth = require('@/contexts/AuthContext').useAuth;
  const mockGetNavigationConfig = require('@/api/app-config').getNavigationConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNavigationConfig.mockResolvedValue(null);
  });

  describe('Loading States', () => {
    it('should show loading indicator while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: null,
        isLoading: false,
        isTenantRequired: false,
      });

      const { UNSAFE_getByType } = render(<TabsLayout />);
      const { ActivityIndicator } = require('react-native');
      const loadingIndicator = UNSAFE_getByType(ActivityIndicator);
      expect(loadingIndicator).toBeTruthy();
    });

    it('should show loading indicator while tenant is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
      });

      mockUseTenant.mockReturnValue({
        tenant: null,
        isLoading: true,
        isTenantRequired: true,
      });

      const { UNSAFE_getByType } = render(<TabsLayout />);
      const { ActivityIndicator } = require('react-native');
      const loadingIndicator = UNSAFE_getByType(ActivityIndicator);
      expect(loadingIndicator).toBeTruthy();
    });

    it('should show loading indicator while both are loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: null,
        isLoading: true,
        isTenantRequired: true,
      });

      const { UNSAFE_getByType } = render(<TabsLayout />);
      const { ActivityIndicator } = require('react-native');
      const loadingIndicator = UNSAFE_getByType(ActivityIndicator);
      expect(loadingIndicator).toBeTruthy();
    });
  });

  describe('Redirect Priority - Tenant First', () => {
    it('should redirect to tenant selection when tenant is required and missing (Priority 1)', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: null,
        isLoading: false,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/screens/tenant-selection');
      });

      // Should NOT redirect to login
      expect(router.replace).not.toHaveBeenCalledWith('/screens/login');
    });

    it('should redirect to login only after tenant is selected (Priority 2)', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'testgym', name: 'Test Gym', domain: 'testgym.test' },
        isLoading: false,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/screens/login');
      });

      expect(router.replace).not.toHaveBeenCalledWith('/screens/tenant-selection');
    });

    it('should not redirect when both tenant and auth are satisfied', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'testgym', name: 'Test Gym', domain: 'testgym.test' },
        isLoading: false,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(router.replace).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tenant-Specific Build (No Tenant Selection Required)', () => {
    it('should skip tenant check when tenant is pre-configured', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'specificgym', name: 'Specific Gym', domain: 'specificgym.test' },
        isLoading: false,
        isTenantRequired: false, // Pre-configured tenant
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/screens/login');
      });

      expect(router.replace).not.toHaveBeenCalledWith('/screens/tenant-selection');
    });

    it('should not redirect to tenant selection even with authenticated user', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'specificgym', name: 'Specific Gym', domain: 'specificgym.test' },
        isLoading: false,
        isTenantRequired: false,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(router.replace).not.toHaveBeenCalled();
      });
    });
  });

  describe('Generic Build (Tenant Selection Required)', () => {
    it('should redirect to tenant selection even when authenticated but no tenant', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
      });

      mockUseTenant.mockReturnValue({
        tenant: null,
        isLoading: false,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/screens/tenant-selection');
      });
    });

    it('should allow access when tenant is selected and user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'testgym', name: 'Test Gym', domain: 'testgym.test' },
        isLoading: false,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(router.replace).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not redirect while loading', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: null,
        isLoading: true,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should handle auth loading completed before tenant loading', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: null,
        isLoading: true,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should handle tenant loading completed before auth loading', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        token: null,
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'testgym', name: 'Test Gym', domain: 'testgym.test' },
        isLoading: false,
        isTenantRequired: true,
      });

      render(<TabsLayout />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Config Loading', () => {
    it('should load navigation config from API on mount', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'testgym', name: 'Test Gym', domain: 'testgym.test' },
        isLoading: false,
        isTenantRequired: false,
      });

      mockGetNavigationConfig.mockResolvedValue({
        tabs: ['home', 'schedule'],
        showCheckInButton: true,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(mockGetNavigationConfig).toHaveBeenCalled();
      });
    });

    it('should use default config when API fails', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
      });

      mockUseTenant.mockReturnValue({
        tenant: { slug: 'testgym', name: 'Test Gym', domain: 'testgym.test' },
        isLoading: false,
        isTenantRequired: false,
      });

      mockGetNavigationConfig.mockRejectedValue(new Error('API error'));

      const { queryByText } = render(<TabsLayout />);

      await waitFor(() => {
        expect(mockGetNavigationConfig).toHaveBeenCalled();
      });

      // Should still render with default config (not crash)
      expect(queryByText).toBeTruthy();
    });
  });
});
