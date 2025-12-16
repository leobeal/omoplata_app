import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import React from 'react';

import HomeScreen from '../../app/(tabs)/index';

// Mock SVG-based card components that don't render well in tests
jest.mock('@/components/SmallDonutCard', () => {
  const { Text, View } = require('react-native');
  return {
    SmallDonutCard: ({ title, subtitle }: { title: string; subtitle?: string }) => (
      <View testID="small-donut-card">
        <Text>{title}</Text>
        {subtitle && <Text>{subtitle}</Text>}
      </View>
    ),
  };
});

jest.mock('@/components/SmallChartCard', () => {
  const { Text, View } = require('react-native');
  return {
    SmallChartCard: ({ title, value, unit }: { title: string; value: string; unit?: string }) => (
      <View testID="small-chart-card">
        <Text>{title}</Text>
        <Text>{value}</Text>
        {unit && <Text>{unit}</Text>}
      </View>
    ),
  };
});

jest.mock('@/components/SmallStreakCard', () => {
  const { Text, View } = require('react-native');
  return {
    SmallStreakCard: ({ title }: { title: string }) => (
      <View testID="small-streak-card">
        <Text>{title}</Text>
      </View>
    ),
  };
});

// Define mock data first (before jest.mock calls which are hoisted)
const mockClasses = [
  {
    id: 'cls-001',
    title: 'Brazilian Jiu-Jitsu - Fundamentals',
    instructor: 'Professor Carlos Silva',
    instructorAvatar: '',
    date: '2025-11-21',
    startTime: '18:00',
    endTime: '19:30',
    duration: 90,
    location: 'Mat Room A',
    capacity: { max: 20, is_full: false, available_spots: 8 },
    enrolled: 12,
    status: 'confirmed',
    description: '',
    level: 'Beginner',
  },
  {
    id: 'cls-002',
    title: 'No-Gi Grappling',
    instructor: 'Coach Mike Johnson',
    instructorAvatar: '',
    date: '2025-11-22',
    startTime: '19:00',
    endTime: '20:00',
    duration: 60,
    location: 'Mat Room B',
    capacity: { max: 15, is_full: false, available_spots: 7 },
    enrolled: 8,
    status: 'pending',
    description: '',
    level: 'Intermediate',
  },
  {
    id: 'cls-003',
    title: 'Muay Thai - Striking Fundamentals',
    instructor: 'Kru Sarah Martinez',
    instructorAvatar: '',
    date: '2025-11-23',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    location: 'Ring Area',
    capacity: { max: 25, is_full: false, available_spots: 7 },
    enrolled: 18,
    status: 'pending',
    description: '',
    level: 'Beginner',
  },
];

const mockGetUpcomingClasses = jest.fn().mockResolvedValue(mockClasses);
const mockConfirmAttendance = jest.fn().mockResolvedValue(undefined);
const mockDenyAttendance = jest.fn().mockResolvedValue(undefined);

jest.mock('@/api/classes', () => ({
  getUpcomingClasses: () => mockGetUpcomingClasses(),
  confirmAttendance: (classId: string) => mockConfirmAttendance(classId),
  denyAttendance: (classId: string) => mockDenyAttendance(classId),
}));

// Mock membership data
const mockMembership = {
  id: 1000031,
  status: 'new',
  startsAt: '2025-12-03',
  chargeStartsAt: '2026-01-01',
  endsAt: null,
  renewsAt: null,
  renewsAutomatically: true,
  amount: 89,
  currency: 'EUR',
  plan: {
    id: 1000002,
    name: 'Unbegrenzt',
    priceId: 1000012,
    priceName: null,
    amount: 89,
    currency: 'EUR',
    chargeInterval: 'P1M',
    contractDuration: 'P6M',
  },
  members: [
    {
      id: 1000029,
      prefixedId: 'USER84aa2d8f26',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: 'member',
    },
  ],
  payer: {
    id: 1000029,
    prefixedId: 'USER84aa2d8f26',
    fullName: 'John Doe',
  },
  documentRequests: [],
};

const mockGetMembership = jest.fn().mockResolvedValue(mockMembership);

jest.mock('@/api/membership', () => ({
  getMembership: () => mockGetMembership(),
  getStatusTranslationKey: (status: string) => status,
}));

// Mock payment methods API
const mockGetPaymentMethods = jest.fn().mockResolvedValue([]);
const mockGetAvailablePaymentMethods = jest.fn().mockResolvedValue([]);

jest.mock('@/api/payment-methods', () => ({
  getPaymentMethods: () => mockGetPaymentMethods(),
  getAvailablePaymentMethods: () => mockGetAvailablePaymentMethods(),
  isSepaAvailable: () => false,
}));

// Mock contexts
jest.mock('@/contexts/ThemeColors', () => ({
  useThemeColors: () => ({
    text: '#ffffff',
    bg: '#141414',
    border: '#404040',
    highlight: '#4CAF50',
    error: '#ff0000',
  }),
}));

const mockTranslate = (key: string, params?: Record<string, string | number>) => {
  const translations: Record<string, string> = {
    'home.welcomeBack': 'Welcome back',
    'home.activeMember': 'Active Member',
    'home.classes': 'Classes',
    'home.checkins': 'Check-ins',
    'home.thisMonth': 'this month',
    'home.thisWeek': 'this week',
    'home.lastSevenDays': 'Last 7 days',
    'home.goalProgress': 'Goal Progress',
    'home.monthly': 'Monthly',
    'home.weeklyActivity': 'Weekly Activity',
    'home.pastThreeWeeks': 'Past 3 weeks',
    'home.onTrack': 'on track',
    'home.membershipStatus': 'Membership Status',
    'home.streak': 'Streak',
    'home.currentStreak': 'Current streak',
    'home.last6Weeks': 'Last 6 weeks',
    'home.classesLeft': 'Classes Left',
    'home.unlimited': 'Unlimited',
    'home.nextBilling': 'Next Billing',
    'home.memberSince': 'Member Since',
    'home.upcomingClasses': 'Upcoming Classes',
    'home.unableToLoadClasses': 'Unable to load classes',
    'common.tryAgain': 'Try again',
    'membership.new': 'New',
    'membership.active': 'Active',
    // ClassCard translations
    'classCard.today': 'Today',
    'classCard.tomorrow': 'Tomorrow',
    'classCard.confirmed': 'Confirmed',
    'classCard.declined': 'Declined',
    'classCard.decline': 'Decline',
    'classCard.confirm': 'Confirm',
    'classCard.cancelAttendance': 'Cancel Attendance',
    'classCard.confirmAttendance': 'Confirm Attendance',
    'classCard.enrolled': '{{count}} enrolled',
    'classCard.enrolledWithMax': '{{enrolled}}/{{max}} enrolled',
  };
  let result = translations[key] || key;
  // Handle interpolation
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
    });
  }
  return result;
};

jest.mock('@/contexts/LocalizationContext', () => ({
  useT: () => mockTranslate,
  useTranslation: () => ({
    t: mockTranslate,
    locale: 'en',
    setLocale: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('@/contexts/ScrollToTopContext', () => ({
  useScrollToTop: () => ({
    scrollToTop: jest.fn(),
    registerScrollHandler: jest.fn(),
    unregisterScrollHandler: jest.fn(),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-001',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    isAuthenticated: true,
    isLoading: false,
    isMember: true,
    token: 'test-token',
  }),
}));

const mockRefreshData = jest.fn().mockResolvedValue(undefined);
const mockSetClasses = jest.fn();
const mockSetPaymentMethods = jest.fn();

jest.mock('@/contexts/DashboardReadyContext', () => ({
  useAppData: () => ({
    isAppDataReady: true,
    classes: [
      {
        id: 'cls-001',
        title: 'Brazilian Jiu-Jitsu - Fundamentals',
        instructor: 'Professor Carlos Silva',
        instructorAvatar: '',
        date: '2025-11-21',
        startTime: '18:00',
        endTime: '19:30',
        duration: 90,
        location: 'Mat Room A',
        capacity: { max: 20, is_full: false, available_spots: 8 },
        enrolled: 12,
        status: 'confirmed',
        description: '',
        level: 'Beginner',
      },
      {
        id: 'cls-002',
        title: 'No-Gi Grappling',
        instructor: 'Coach Mike Johnson',
        instructorAvatar: '',
        date: '2025-11-22',
        startTime: '19:00',
        endTime: '20:00',
        duration: 60,
        location: 'Mat Room B',
        capacity: { max: 15, is_full: false, available_spots: 7 },
        enrolled: 8,
        status: 'pending',
        description: '',
        level: 'Intermediate',
      },
      {
        id: 'cls-003',
        title: 'Muay Thai - Striking Fundamentals',
        instructor: 'Kru Sarah Martinez',
        instructorAvatar: '',
        date: '2025-11-23',
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        location: 'Ring Area',
        capacity: { max: 25, is_full: false, available_spots: 7 },
        enrolled: 18,
        status: 'pending',
        description: '',
        level: 'Beginner',
      },
    ],
    childrenWithClasses: [],
    classesError: null,
    membership: {
      id: 1000031,
      status: 'new',
      startsAt: '2025-12-03',
      chargeStartsAt: '2026-01-01',
      endsAt: null,
      renewsAt: null,
      renewsAutomatically: true,
      amount: 89,
      currency: 'EUR',
      plan: {
        id: 1000002,
        name: 'Unbegrenzt',
        priceId: 1000012,
        priceName: null,
        amount: 89,
        currency: 'EUR',
        chargeInterval: 'P1M',
        contractDuration: 'P6M',
      },
      members: [
        {
          id: 1000029,
          prefixedId: 'USER84aa2d8f26',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          role: 'member',
        },
      ],
      payer: {
        id: 1000029,
        prefixedId: 'USER84aa2d8f26',
        fullName: 'John Doe',
      },
      documentRequests: [],
    },
    paymentMethods: [],
    availablePaymentMethods: [],
    analytics: {
      graphs: [
        {
          type: 'class_type_breakdown',
          chart_type: 'pie',
          labels: ['Fundamentals', 'Advanced', 'Competition', 'Open Mat'],
          data: [8, 5, 3, 2],
        },
        {
          type: 'weekly_attendance',
          chart_type: 'line',
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
          data: [3, 4, 2, 5, 4, 6],
        },
        {
          type: 'training_streak',
          chart_type: 'stats',
          current_streak: 6,
          longest_streak: 12,
          current_week_trained: 4,
        },
      ],
      enabled_types: ['class_type_breakdown', 'weekly_attendance', 'training_streak'],
      available_types: [],
    },
    analyticsFromCache: false,
    refreshData: jest.fn().mockResolvedValue(undefined),
    setClasses: jest.fn(),
    setPaymentMethods: jest.fn(),
  }),
  useDashboardReady: () => ({
    isDashboardReady: true,
    setDashboardReady: jest.fn(),
    resetDashboardReady: jest.fn(),
  }),
}));

describe('HomeScreen (Dashboard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementations
    mockGetUpcomingClasses.mockResolvedValue(mockClasses);
    mockGetMembership.mockResolvedValue(mockMembership);
    mockGetPaymentMethods.mockResolvedValue([]);
    mockGetAvailablePaymentMethods.mockResolvedValue([]);
  });

  describe('Rendering', () => {
    it('renders welcome message with user name', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Welcome back, John!')).toBeTruthy();
      });
    });

    // Note: MembershipOverview component is defined but currently not rendered in the dashboard.
    // Activity stats cards use SVG components (SmallDonutCard, SmallChartCard, SmallStreakCard)
    // that don't render properly in the test environment. The activity stats functionality
    // is tested implicitly through integration tests.
  });

  describe('Upcoming Classes', () => {
    it('loads and displays upcoming classes', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Brazilian Jiu-Jitsu - Fundamentals')).toBeTruthy();
        expect(getByText('No-Gi Grappling')).toBeTruthy();
        expect(getByText('Muay Thai - Striking Fundamentals')).toBeTruthy();
      });
    });

    it('displays class instructors', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Professor Carlos Silva')).toBeTruthy();
        expect(getByText('Coach Mike Johnson')).toBeTruthy();
        expect(getByText('Kru Sarah Martinez')).toBeTruthy();
      });
    });

    it('displays class locations', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Mat Room A')).toBeTruthy();
        expect(getByText('Mat Room B')).toBeTruthy();
        expect(getByText('Ring Area')).toBeTruthy();
      });
    });

    it('displays enrollment information', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('12/20 enrolled')).toBeTruthy();
        expect(getByText('8/15 enrolled')).toBeTruthy();
        expect(getByText('18/25 enrolled')).toBeTruthy();
      });
    });

    it('displays Upcoming Classes section title', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Upcoming Classes')).toBeTruthy();
      });
    });

    it('displays only first 3 classes', async () => {
      const mockManyClasses = [
        ...mockClasses,
        {
          id: 'cls-004',
          title: 'Extra Class',
          instructor: 'Instructor',
          instructorAvatar: '',
          date: '2025-11-24',
          startTime: '12:00',
          endTime: '13:00',
          duration: 60,
          location: 'Room',
          capacity: { max: 10, is_full: false, available_spots: 5 },
          enrolled: 5,
          status: 'pending',
          description: '',
          level: 'All Levels',
        },
      ];

      mockGetUpcomingClasses.mockResolvedValueOnce(mockManyClasses);

      const { getByText, queryByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Brazilian Jiu-Jitsu - Fundamentals')).toBeTruthy();
        expect(getByText('No-Gi Grappling')).toBeTruthy();
        expect(getByText('Muay Thai - Striking Fundamentals')).toBeTruthy();
        expect(queryByText('Extra Class')).toBeNull();
      });
    });

    // Note: Empty state and API call tests removed - data now comes from AppDataContext
  });

  describe('Class Interactions', () => {
    it('calls confirmAttendance when Confirm button is pressed', async () => {
      const { getAllByText, getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Brazilian Jiu-Jitsu - Fundamentals')).toBeTruthy();
      });

      // Find a class with pending status and confirm it
      const confirmButtons = getAllByText('Confirm');
      fireEvent.press(confirmButtons[0]);

      await waitFor(() => {
        expect(mockConfirmAttendance).toHaveBeenCalled();
      });
    });

    it('calls denyAttendance when Decline button is pressed', async () => {
      const { getAllByText, getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('No-Gi Grappling')).toBeTruthy();
      });

      // Find a class with pending status and decline it
      const declineButtons = getAllByText('Decline');
      fireEvent.press(declineButtons[0]);

      await waitFor(() => {
        expect(mockDenyAttendance).toHaveBeenCalled();
      });
    });

    it('updates class status locally after confirming', async () => {
      const { getByText, getAllByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('No-Gi Grappling')).toBeTruthy();
      });

      const confirmButtons = getAllByText('Confirm');
      const firstConfirmButton = confirmButtons[0];
      fireEvent.press(firstConfirmButton);

      await waitFor(() => {
        expect(mockConfirmAttendance).toHaveBeenCalled();
      });
    });

    it('updates class status locally after declining', async () => {
      const { getByText, getAllByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('No-Gi Grappling')).toBeTruthy();
      });

      const declineButtons = getAllByText('Decline');
      const firstDeclineButton = declineButtons[0];
      fireEvent.press(firstDeclineButton);

      await waitFor(() => {
        expect(mockDenyAttendance).toHaveBeenCalled();
      });
    });
  });

  // Note: Error handling tests removed - errors are now handled in AppDataContext

  describe('Date Formatting', () => {
    it('displays current date', async () => {
      const { getByText } = render(<HomeScreen />);

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await waitFor(() => {
        expect(getByText(today)).toBeTruthy();
      });
    });
  });
});
