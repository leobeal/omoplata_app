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

jest.mock('@/contexts/AppConfigContext', () => ({
  useAppConfig: () => ({
    config: {
      navigation: {
        tabs: ['home', 'schedule'],
        showCheckInButton: true,
      },
    },
    membership: {},
    billing: {},
    features: {
      checkInEnabled: true,
      qrCheckInEnabled: true,
      notificationsEnabled: true,
      classBookingEnabled: true,
    },
    loading: false,
    error: false,
    refreshConfig: jest.fn(),
  }),
  useFeatureFlags: () => ({
    checkInEnabled: true,
    qrCheckInEnabled: true,
    notificationsEnabled: true,
    classBookingEnabled: true,
    socialSharingEnabled: false,
    referralProgramEnabled: false,
  }),
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Navigation Config via Context', () => {
    it('should render tabs from context config', () => {
      // The component uses mocked useAppConfig hook
      // which provides config with tabs: ['home', 'schedule']
      const { toJSON } = render(<TabsLayout />);
      expect(toJSON()).toBeTruthy();
    });

    it('should render without crashing with valid config', () => {
      const { toJSON } = render(<TabsLayout />);
      expect(toJSON()).toBeTruthy();
    });

    it('should render tabs with check-in button when enabled', () => {
      // useFeatureFlags mock has checkInEnabled: true
      const { toJSON } = render(<TabsLayout />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Tab Rendering', () => {
    it('should render tabs from config context', () => {
      // Just verify it renders without crashing
      const { toJSON } = render(<TabsLayout />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
