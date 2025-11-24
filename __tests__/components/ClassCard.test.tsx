import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ClassCard from '../../components/ClassCard';
import { Class } from '@/api/classes';

// Mock the contexts
jest.mock('@/contexts/ThemeColors', () => ({
  useThemeColors: () => ({
    text: '#ffffff',
    bg: '#141414',
    border: '#404040',
  }),
}));

describe('ClassCard', () => {
  const mockOnConfirm = jest.fn();
  const mockOnDeny = jest.fn();

  const mockClassData: Class = {
    id: 'class-001',
    title: 'Brazilian Jiu-Jitsu Fundamentals',
    instructor: 'Professor Silva',
    instructorAvatar: '',
    date: '2024-11-22',
    startTime: '18:00',
    endTime: '19:30',
    duration: 90,
    location: 'Main Mat',
    capacity: {
      max: 30,
      is_full: false,
      available_spots: 6,
    },
    enrolled: 24,
    status: 'pending',
    description: 'Fundamentals class for beginners',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnConfirm.mockResolvedValue(undefined);
    mockOnDeny.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders class information correctly', () => {
      const { getByText } = render(
        <ClassCard classData={mockClassData} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Brazilian Jiu-Jitsu Fundamentals')).toBeTruthy();
      expect(getByText('Professor Silva')).toBeTruthy();
      expect(getByText('Main Mat')).toBeTruthy();
      expect(getByText('24/30 enrolled')).toBeTruthy();
    });

    it('formats time correctly for AM times', () => {
      const morningClass = { ...mockClassData, startTime: '09:00', endTime: '10:30' };
      const { getByText } = render(
        <ClassCard classData={morningClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('9:00 AM - 10:30 AM')).toBeTruthy();
    });

    it('formats time correctly for PM times', () => {
      const eveningClass = { ...mockClassData, startTime: '18:00', endTime: '19:30' };
      const { getByText } = render(
        <ClassCard classData={eveningClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('6:00 PM - 7:30 PM')).toBeTruthy();
    });

    it('formats date as "Today" for today\'s classes', () => {
      const today = new Date().toISOString().split('T')[0];
      const todayClass = { ...mockClassData, date: today };
      const { getByText } = render(
        <ClassCard classData={todayClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Today')).toBeTruthy();
    });

    it('formats date as "Tomorrow" for tomorrow\'s classes', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      const tomorrowClass = { ...mockClassData, date: tomorrowDate };
      const { getByText } = render(
        <ClassCard classData={tomorrowClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Tomorrow')).toBeTruthy();
    });

    it('shows Confirm and Decline buttons for pending status', () => {
      const { getByText } = render(
        <ClassCard classData={mockClassData} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Confirm')).toBeTruthy();
      expect(getByText('Decline')).toBeTruthy();
    });

    it('shows Confirmed badge when status is confirmed', () => {
      const confirmedClass = { ...mockClassData, status: 'confirmed' as const };
      const { getByText } = render(
        <ClassCard classData={confirmedClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Confirmed')).toBeTruthy();
    });

    it('shows Declined badge when status is denied', () => {
      const deniedClass = { ...mockClassData, status: 'denied' as const };
      const { getByText } = render(
        <ClassCard classData={deniedClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Declined')).toBeTruthy();
    });

    it('shows Cancel Attendance button for confirmed classes', () => {
      const confirmedClass = { ...mockClassData, status: 'confirmed' as const };
      const { getByText } = render(
        <ClassCard classData={confirmedClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Cancel Attendance')).toBeTruthy();
    });

    it('shows Confirm Attendance button for denied classes', () => {
      const deniedClass = { ...mockClassData, status: 'denied' as const };
      const { getByText } = render(
        <ClassCard classData={deniedClass} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      expect(getByText('Confirm Attendance')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm when Confirm button is pressed', async () => {
      const { getByText } = render(
        <ClassCard classData={mockClassData} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      const confirmButton = getByText('Confirm');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('class-001');
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onDeny when Decline button is pressed', async () => {
      const { getByText } = render(
        <ClassCard classData={mockClassData} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      const declineButton = getByText('Decline');
      fireEvent.press(declineButton);

      await waitFor(() => {
        expect(mockOnDeny).toHaveBeenCalledWith('class-001');
        expect(mockOnDeny).toHaveBeenCalledTimes(1);
      });
    });

    it('updates status to confirmed after confirming', async () => {
      const { getByText, queryByText } = render(
        <ClassCard classData={mockClassData} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      const confirmButton = getByText('Confirm');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(getByText('Confirmed')).toBeTruthy();
        expect(queryByText('Confirm')).toBeNull();
        expect(queryByText('Decline')).toBeNull();
      });
    });

    it('updates status to denied after declining', async () => {
      const { getByText, queryByText } = render(
        <ClassCard classData={mockClassData} onConfirm={mockOnConfirm} onDeny={mockOnDeny} />
      );

      const declineButton = getByText('Decline');
      fireEvent.press(declineButton);

      await waitFor(() => {
        expect(getByText('Declined')).toBeTruthy();
        expect(queryByText('Confirm')).toBeNull();
        expect(queryByText('Decline')).toBeNull();
      });
    });

    it('shows loading indicator when confirming', async () => {
      let resolveConfirm: () => void;
      const delayedConfirm = jest.fn(
        () => new Promise<void>((resolve) => { resolveConfirm = resolve; })
      );

      const { getByText, queryByText, UNSAFE_getAllByType } = render(
        <ClassCard classData={mockClassData} onConfirm={delayedConfirm} onDeny={mockOnDeny} />
      );

      const confirmButton = getByText('Confirm');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        // Check that Confirm text is gone (replaced by loading indicator)
        expect(queryByText('Confirm')).toBeNull();
      });

      // Resolve the promise
      resolveConfirm!();
    });

    it('handles async confirm actions', async () => {
      let resolveConfirm: () => void;
      const delayedConfirm = jest.fn(
        () => new Promise<void>((resolve) => { resolveConfirm = resolve; })
      );

      const { getByText } = render(
        <ClassCard classData={mockClassData} onConfirm={delayedConfirm} onDeny={mockOnDeny} />
      );

      const confirmButton = getByText('Confirm');
      fireEvent.press(confirmButton);

      // Wait for the promise to be called
      await waitFor(() => {
        expect(delayedConfirm).toHaveBeenCalled();
      });

      // Resolve the promise
      resolveConfirm!();

      // Wait for status update
      await waitFor(() => {
        expect(getByText('Confirmed')).toBeTruthy();
      });
    });

    it('handles errors gracefully during confirm', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const failingConfirm = jest.fn().mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <ClassCard classData={mockClassData} onConfirm={failingConfirm} onDeny={mockOnDeny} />
      );

      const confirmButton = getByText('Confirm');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(failingConfirm).toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('handles errors gracefully during deny', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const failingDeny = jest.fn().mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <ClassCard classData={mockClassData} onConfirm={mockOnConfirm} onDeny={failingDeny} />
      );

      const declineButton = getByText('Decline');
      fireEvent.press(declineButton);

      await waitFor(() => {
        expect(failingDeny).toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
