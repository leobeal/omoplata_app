import { render, waitFor, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

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
      'membership.membershipId': 'Membership ID',
      'membership.members': 'Members',
      'membership.contractDetails': 'Contract Details',
      'membership.startDate': 'Start Date',
      'membership.endDate': 'End Date',
      'membership.renewalDate': 'Renewal Date',
      'membership.autoRenewal': 'Auto-Renewal',
      'membership.enabled': 'Enabled',
      'membership.disabled': 'Disabled',
      'membership.pricing': 'Pricing',
      'membership.annualFee': 'Annual Fee',
      'membership.monthlyFee': 'Monthly Fee',
      'membership.monthlyEquivalent': 'Monthly Equivalent',
      'membership.perMonth': '/mo',
      'membership.billedAnnually': 'Billed annually',
      'membership.billedMonthly': 'Billed monthly',
      'membership.billedWeekly': 'Billed weekly',
      'membership.paymentMethod': 'Payment Method',
      'membership.policies': 'Membership Policies',
      'membership.cancellationPolicy': 'Cancellation Policy',
      'membership.freezePolicy': 'Freeze Policy',
      'membership.transferPolicy': 'Transfer Policy',
      'membership.defaultCancellationPolicy': 'Contact support for cancellation',
      'membership.defaultFreezePolicy': 'Freeze available upon request',
      'membership.defaultTransferPolicy': 'Memberships are non-transferable',
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
      'membership.pending': 'Pending',
      'membership.suspended': 'Suspended',
      'membership.cancelled': 'Cancelled',
      'membership.expired': 'Expired',
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

// Mock the membership API with new structure
jest.mock('@/api/membership', () => ({
  getMembership: jest.fn(() =>
    Promise.resolve({
      id: 'mem_abc123',
      status: 'active',
      startsAt: '2024-01-15T00:00:00Z',
      chargeStartsAt: '2024-01-15T00:00:00Z',
      endsAt: '2024-12-15T23:59:59Z',
      renewsAt: '2024-12-15T00:00:00Z',
      renewsAutomatically: true,
      amount: 100,
      currency: 'EUR',
      plan: {
        id: 'plan_premium',
        name: 'Annual Premium',
        priceId: 'price_abc123',
        priceName: 'Annual Payment',
        amount: 1200,
        currency: 'EUR',
        chargeInterval: 'yearly',
        contractDuration: 12,
      },
      members: [
        {
          id: 'usr_001',
          prefixedId: 'MEM-2024-001',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          role: 'primary',
        },
      ],
      payer: {
        id: 'usr_001',
        prefixedId: 'MEM-2024-001',
        fullName: 'John Doe',
      },
    })
  ),
  downloadContract: jest.fn(() =>
    Promise.resolve('https://api.omoplata.com/memberships/mem_abc123/contract/download')
  ),
  getPrimaryMember: jest.fn((membership: any) =>
    membership.members.find((m: any) => m.role === 'primary')
  ),
  getMonthlyEquivalent: jest.fn((plan: any) => {
    if (plan.chargeInterval === 'yearly') return plan.amount / 12;
    return plan.amount;
  }),
  formatCurrency: jest.fn((amount: number, currency: string) => {
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  }),
}));

// Mock the payment methods API
jest.mock('@/api/payment-methods', () => ({
  getPaymentMethod: jest.fn(() =>
    Promise.resolve({
      id: 'pm_abc123',
      type: 'SEPA Direct Debit',
      maskedIban: 'DE89 •••• •••• •••• •••• 00',
      accountHolder: 'John Doe',
      isDefault: true,
      createdAt: '2024-01-15T00:00:00Z',
    })
  ),
}));

const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('MembershipScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      const { getAllByTestId } = render(<MembershipScreen />);

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
        expect(getByText('mem_abc123')).toBeTruthy();
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
        expect(getByText('€1200.00')).toBeTruthy();
        expect(getByText('€100.00/mo')).toBeTruthy();
      });
    });

    it('shows payment method details', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Payment Method')).toBeTruthy();
        expect(getByText('SEPA Direct Debit')).toBeTruthy();
        expect(getByText('DE89 •••• •••• •••• •••• 00')).toBeTruthy();
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
        expect(downloadContract).toHaveBeenCalledWith('mem_abc123');
        expect(mockAlert).toHaveBeenCalledWith(
          'Contract PDF',
          'Contract PDF available at: https://api.omoplata.com/memberships/mem_abc123/contract/download',
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
