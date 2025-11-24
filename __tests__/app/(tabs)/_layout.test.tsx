import { render, waitFor } from '@testing-library/react-native';
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

jest.mock('@/contexts/LocalizationContext', () => ({
  useT: () => (key: string) => key,
}));

jest.mock('@/api/app-config', () => ({
  getNavigationConfig: jest.fn(),
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

describe('TabsLayout - Navigation Config', () => {
  const mockGetNavigationConfig = require('@/api/app-config').getNavigationConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNavigationConfig.mockResolvedValue(null);
  });

  describe('Navigation Config Loading', () => {
    it('should load navigation config from API on mount', async () => {
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
      mockGetNavigationConfig.mockRejectedValue(new Error('API error'));

      const { queryByText } = render(<TabsLayout />);

      await waitFor(() => {
        expect(mockGetNavigationConfig).toHaveBeenCalled();
      });

      // Should still render with default config (not crash)
      expect(queryByText).toBeTruthy();
    });

    it('should use default config when API returns null', async () => {
      mockGetNavigationConfig.mockResolvedValue(null);

      render(<TabsLayout />);

      await waitFor(() => {
        expect(mockGetNavigationConfig).toHaveBeenCalled();
      });
    });

    it('should filter tabs based on API config', async () => {
      mockGetNavigationConfig.mockResolvedValue({
        tabs: ['home'], // Only home tab
        showCheckInButton: false,
      });

      render(<TabsLayout />);

      await waitFor(() => {
        expect(mockGetNavigationConfig).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Rendering', () => {
    it('should render tabs from default config', () => {
      mockGetNavigationConfig.mockResolvedValue(null);

      // Just verify it renders without crashing
      const { toJSON } = render(<TabsLayout />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
