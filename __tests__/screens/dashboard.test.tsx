import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';

// Mock the contexts
jest.mock('@/contexts/ThemeColors', () => ({
  useThemeColors: () => ({
    text: '#ffffff',
    bg: '#141414',
    border: '#404040',
    highlight: '#4CAF50',
  }),
}));

jest.mock('@/contexts/LocalizationContext', () => ({
  useT: () => (key: string) => {
    const translations: Record<string, string> = {
      'home.welcomeBack': 'Welcome back!',
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
      'home.classesLeft': 'Classes Left',
      'home.unlimited': 'Unlimited',
      'home.nextBilling': 'Next Billing',
      'home.memberSince': 'Member Since',
    };
    return translations[key] || key;
  },
}));

jest.mock('@/contexts/ScrollToTopContext', () => ({
  useScrollToTop: () => ({
    scrollToTop: jest.fn(),
    registerScrollHandler: jest.fn(),
    unregisterScrollHandler: jest.fn(),
  }),
}));

// Mock the classes API
const mockClasses = [
  {
    id: 'cls-001',
    title: 'Brazilian Jiu-Jitsu - Fundamentals',
    instructor: 'Professor Carlos Silva',
    date: '2025-11-21',
    startTime: '18:00',
    endTime: '19:30',
    location: 'Mat Room A',
    capacity: 20,
    enrolled: 12,
    status: 'confirmed',
  },
  {
    id: 'cls-002',
    title: 'No-Gi Grappling',
    instructor: 'Coach Mike Johnson',
    date: '2025-11-22',
    startTime: '19:00',
    endTime: '20:00',
    location: 'Mat Room B',
    capacity: 15,
    enrolled: 8,
    status: 'pending',
  },
  {
    id: 'cls-003',
    title: 'Muay Thai - Striking Fundamentals',
    instructor: 'Kru Sarah Martinez',
    date: '2025-11-23',
    startTime: '10:00',
    endTime: '11:00',
    location: 'Ring Area',
    capacity: 25,
    enrolled: 18,
    status: 'pending',
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

describe('HomeScreen (Dashboard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders welcome message', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Welcome back!')).toBeTruthy();
      });
    });

    it('renders membership overview', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Premium')).toBeTruthy();
        expect(getByText('Active Member')).toBeTruthy();
        expect(getByText('Membership Status')).toBeTruthy();
      });
    });

    it('renders activity stats cards', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Classes')).toBeTruthy();
        expect(getByText('Check-ins')).toBeTruthy();
        expect(getByText('Goal Progress')).toBeTruthy();
        expect(getByText('Weekly Activity')).toBeTruthy();
      });
    });
  });

  describe('Upcoming Classes', () => {
    it('shows loading indicator while fetching classes', () => {
      const { getAllByTestId } = render(<HomeScreen />);

      // ActivityIndicator should be present initially
      const indicators = getAllByTestId(/activity-indicator/i);
      expect(indicators.length).toBeGreaterThan(0);
    });

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
          date: '2025-11-24',
          startTime: '12:00',
          endTime: '13:00',
          location: 'Room',
          capacity: 10,
          enrolled: 5,
          status: 'pending',
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

    it('shows empty state when no classes available', async () => {
      mockGetUpcomingClasses.mockResolvedValueOnce([]);

      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('No upcoming classes scheduled')).toBeTruthy();
      });
    });

    it('calls getUpcomingClasses on mount', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(mockGetUpcomingClasses).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Class Interactions', () => {
    it('calls confirmAttendance when Confirm button is pressed', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Brazilian Jiu-Jitsu - Fundamentals')).toBeTruthy();
      });

      // Find a class with pending status and confirm it
      const confirmButton = getByText('Confirm');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockConfirmAttendance).toHaveBeenCalled();
      });
    });

    it('calls denyAttendance when Decline button is pressed', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('No-Gi Grappling')).toBeTruthy();
      });

      // Find a class with pending status and decline it
      const declineButton = getByText('Decline');
      fireEvent.press(declineButton);

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

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockGetUpcomingClasses.mockRejectedValueOnce(new Error('Network error'));

      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
        // The screen should not crash and should show empty state
        expect(getByText('No upcoming classes scheduled')).toBeTruthy();
      });

      consoleError.mockRestore();
    });
  });

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
