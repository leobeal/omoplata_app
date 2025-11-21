import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import MembershipScreen from '../../app/(tabs)/membership';

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
      'membership.title': 'My Membership',
      'membership.currentPlan': 'Current Plan',
      'membership.memberId': 'Member ID',
      'membership.contractId': 'Contract ID',
      'membership.contractDetails': 'Contract Details',
      'membership.startDate': 'Start Date',
      'membership.endDate': 'End Date',
      'membership.renewalDate': 'Renewal Date',
      'membership.autoRenewal': 'Auto-Renewal',
      'membership.enabled': 'Enabled',
      'membership.disabled': 'Disabled',
      'membership.pricing': 'Pricing',
      'membership.annualFee': 'Annual Fee',
      'membership.monthlyEquivalent': 'Monthly Equivalent',
      'membership.planFeatures': 'Plan Features',
      'membership.paymentMethod': 'Payment Method',
      'membership.policies': 'Membership Policies',
      'membership.downloadContract': 'Download Contract PDF',
      'membership.active': 'Active',
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

jest.mock('@/contexts/AppConfigContext', () => ({
  useMembershipSettings: () => ({
    allowCancellation: true,
    allowPause: true,
    allowFreeze: true,
    allowPlanChange: true,
    allowGuestPasses: true,
    showContractDownload: true,
    cancellationNoticeDays: 30,
    maxFreezeDaysPerYear: 90,
  }),
}));

// Mock the API - inline the mock data to ensure proper hoisting
jest.mock('@/api/membership', () => ({
  getMembership: jest.fn(() =>
    Promise.resolve({
      memberId: 'MEM-2024-001',
      memberName: 'John Doe',
      email: 'johndoe@example.com',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Fitness Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      contract: {
        id: 'CNT-2024-001',
        type: 'Annual Premium',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        renewalDate: '2024-12-31',
        autoRenewal: true,
        price: {
          amount: 1200,
          currency: 'USD',
          billingCycle: 'annual',
          monthlyEquivalent: 100,
        },
        cancellationPolicy: 'Cancel anytime with 30 days notice',
        freezePolicy: 'Freeze membership for up to 3 months per year',
        transferPolicy: 'Non-transferable',
      },
      features: [
        {
          name: 'Unlimited Classes',
          description: 'Access to all classes',
          included: true,
        },
        {
          name: 'Guest Passes',
          description: 'Bring friends',
          included: true,
          limit: '5 per month',
        },
      ],
      paymentMethod: {
        type: 'SEPA Direct Debit',
        iban: 'DE89 3704 0044 0532 •••• 00',
        accountHolder: 'John Doe',
      },
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543',
      },
      medicalInfo: {
        bloodType: 'O+',
        allergies: 'None',
        conditions: 'None',
        lastCheckup: '2024-06-15',
      },
    })
  ),
  downloadContract: jest.fn(() => Promise.resolve('/contracts/CNT-2024-001.pdf')),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('MembershipScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      const { getByTestId, getAllByTestId } = render(<MembershipScreen />);

      // ActivityIndicator should be present
      const indicators = getAllByTestId(/activity-indicator/i);
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering', () => {
    it('renders membership data after loading', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Annual Premium')).toBeTruthy();
        expect(getByText('MEM-2024-001')).toBeTruthy();
        expect(getByText('CNT-2024-001')).toBeTruthy();
      });
    });

    it('displays contract details', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Contract Details')).toBeTruthy();
        expect(getByText('Start Date')).toBeTruthy();
        expect(getByText('End Date')).toBeTruthy();
        expect(getByText('Renewal Date')).toBeTruthy();
      });
    });

    it('shows active status badge', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Active')).toBeTruthy();
      });
    });

    it('displays pricing information', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Pricing')).toBeTruthy();
        expect(getByText('$1200.00')).toBeTruthy();
        expect(getByText('$100.00/mo')).toBeTruthy();
      });
    });

    it('displays plan features', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Plan Features')).toBeTruthy();
        expect(getByText('Unlimited Classes')).toBeTruthy();
        expect(getByText('Guest Passes')).toBeTruthy();
      });
    });

    it('shows payment method details', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Payment Method')).toBeTruthy();
        expect(getByText('SEPA Direct Debit')).toBeTruthy();
        expect(getByText('DE89 3704 0044 0532 •••• 00')).toBeTruthy();
      });
    });

    it('displays membership policies', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Membership Policies')).toBeTruthy();
        expect(getByText('Cancel anytime with 30 days notice')).toBeTruthy();
      });
    });

    it('shows download contract button', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Download Contract PDF')).toBeTruthy();
      });
    });

    it('shows auto-renewal status as enabled', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Auto-Renewal')).toBeTruthy();
        expect(getByText('Enabled')).toBeTruthy();
      });
    });
  });

  describe('Download Contract', () => {
    it('calls downloadContract when button is pressed', async () => {
      const Alert = require('react-native/Libraries/Alert/Alert');
      const { downloadContract } = require('@/api/membership');
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Download Contract PDF')).toBeTruthy();
      });

      const downloadButton = getByText('Download Contract PDF');
      fireEvent.press(downloadButton);

      await waitFor(() => {
        expect(downloadContract).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith(
          'Contract PDF',
          expect.stringContaining('/contracts/CNT-2024-001'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const { getMembership } = require('@/api/membership');
      getMembership.mockRejectedValueOnce(new Error('Network error'));

      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const { queryByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
        // The screen should not crash
        expect(queryByText('My Membership')).toBeTruthy();
      });

      consoleError.mockRestore();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        // Check that dates are formatted (they should contain month names)
        expect(getByText(/January/)).toBeTruthy();
        expect(getByText(/December/)).toBeTruthy();
      });
    });
  });
});
