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
  useT: () => (key: string, params?: any) => {
    const translations: Record<string, string | ((p: any) => string)> = {
      'membership.title': 'My Membership',
      'membership.currentPlan': 'Current Plan',
      'membership.memberId': 'Member ID',
      'membership.contractId': 'Contract ID',
      'membership.contractDetails': 'Contract Details',
      'membership.startDate': 'Start Date',
      'membership.endDate': 'End Date',
      'membership.renewalDate': 'Renewal Date',
      'membership.nextCancellationDate': 'Next Cancellation Date',
      'membership.autoRenewal': 'Auto-Renewal',
      'membership.enabled': 'Enabled',
      'membership.disabled': 'Disabled',
      'membership.pricing': 'Pricing',
      'membership.annualFee': 'Annual Fee',
      'membership.monthlyEquivalent': 'Monthly Equivalent',
      'membership.perMonth': '/mo',
      'membership.billedAnnually': 'Billed annually',
      'membership.billedMonthly': 'Billed monthly',
      'membership.planFeatures': 'Plan Features',
      'membership.paymentMethod': 'Payment Method',
      'membership.policies': 'Membership Policies',
      'membership.cancellationPolicy': 'Cancellation Policy',
      'membership.freezePolicy': 'Freeze Policy',
      'membership.transferPolicy': 'Transfer Policy',
      'membership.upTo': 'up to',
      'membership.daysPerYear': (p: any) => `${p.count} days per year`,
      'membership.daysNoticeRequired': (p: any) => `${p.count} days notice required`,
      'membership.downloadContract': 'Download Contract PDF',
      'membership.contractPdfTitle': 'Contract PDF',
      'membership.contractDownloadMessage': (p: any) => `Contract PDF available at: ${p.url}`,
      'membership.downloadError': 'Failed to download contract',
      'membership.supportMessage': 'For any questions, please contact support',
      'membership.noMembership': 'No membership found',
      'membership.cancelMembership': 'Cancel Membership',
      'membership.active': 'Active',
      'common.error': 'Error',
      'common.confirm': 'Confirm',
    };
    const translation = translations[key];
    if (typeof translation === 'function') {
      return translation(params);
    }
    return translation || key;
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
  useFeatureFlags: () => ({
    enableMemberships: true,
    enableCheckIn: true,
    enableClasses: true,
    enableBilling: true,
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
        startDate: '2024-01-15',
        endDate: '2024-12-15',
        renewalDate: '2024-12-15',
        nextCancellationDate: '2024-11-15',
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

// Mock Alert - we'll spy on it in the test
import { Alert } from 'react-native';
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

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
        expect(getByText('Cancellation Policy')).toBeTruthy();
        expect(getByText('Freeze Policy')).toBeTruthy();
        expect(getByText('Transfer Policy')).toBeTruthy();
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
      const { downloadContract } = require('@/api/membership');
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Download Contract PDF')).toBeTruthy();
      });

      const downloadButton = getByText('Download Contract PDF');
      fireEvent.press(downloadButton);

      await waitFor(() => {
        expect(downloadContract).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith(
          'Contract PDF',
          'Contract PDF available at: /contracts/CNT-2024-001.pdf',
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
      const { getAllByText } = render(<MembershipScreen />);

      await waitFor(() => {
        // Check that dates are formatted (they should contain month names)
        const januaryDates = getAllByText(/January/);
        const decemberDates = getAllByText(/December/);
        expect(januaryDates.length).toBeGreaterThan(0);
        expect(decemberDates.length).toBeGreaterThan(0);
      });
    });
  });
});
