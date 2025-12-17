import { render, waitFor, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import MembershipScreen from '../../app/screens/membership';

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test.pdf', name: 'test.pdf', mimeType: 'application/pdf' }],
    })
  ),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    })
  ),
}));

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
      'membership.title': 'Membership',
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
      'membership.contractDuration': 'Contract Duration',
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
      'membership.new': 'New',
      'membership.onboardingStarted': 'Onboarding Started',
      'membership.active': 'Active',
      'membership.paused': 'Paused',
      'membership.cancelled': 'Cancelled',
      'membership.defaulted': 'Defaulted',
      'common.error': 'Error',
      'common.confirm': 'Confirm',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      // Frequency translations
      'frequency.recurring.P1M': 'monthly',
      'frequency.recurring.P1Y': 'yearly',
      'frequency.recurring.P6M': 'every 6 months',
      'frequency.once.P6M': '6 months',
      'frequency.once.P1Y': '1 year',
      'frequency.once.P12M': '12 months',
      // Document request translations
      'membership.pendingDocuments': 'Pending Documents',
      'membership.uploadDocument': 'Upload Document',
      'membership.uploading': 'Uploading...',
      'membership.uploadSuccess': 'Document uploaded successfully',
      'membership.uploadError': 'Failed to upload document',
      'membership.selectFile': 'Select File',
      'membership.takePhoto': 'Take Photo',
      'membership.chooseFromLibrary': 'Choose from Library',
      'membership.documentTypes.studentProof': 'Student ID',
      'checkin.permissionRequired': 'Camera permission required',
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

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    },
    token: 'mock-auth-token',
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
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
      id: 1000031,
      status: 'active',
      startsAt: '2024-01-15',
      chargeStartsAt: '2024-02-01',
      endsAt: '2024-12-15',
      renewsAt: '2024-12-15',
      renewsAutomatically: true,
      amount: 89,
      currency: 'EUR',
      plan: {
        id: 1000002,
        name: 'Annual Premium',
        priceId: 1000012,
        priceName: null,
        amount: 1068,
        currency: 'EUR',
        chargeInterval: 'P1Y',
        contractDuration: 'P12M',
      },
      members: [
        {
          id: 1000029,
          prefixedId: 'MEM-2024-001',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          role: 'member',
        },
      ],
      payer: {
        id: 1000029,
        prefixedId: 'MEM-2024-001',
        fullName: 'John Doe',
      },
      documentRequests: [
        {
          id: 1,
          ulid: '01HXYZ123ABC',
          status: 'pending',
          reason: 'Please provide student ID',
          note: null,
          uploadedAt: null,
          createdAt: '2024-12-06T22:00:00+00:00',
          documentType: {
            id: 1,
            name: 'student_proof',
          },
          user: {
            id: 1000029,
            prefixedId: 'MEM-2024-001',
            fullName: 'John Doe',
          },
        },
      ],
    })
  ),
  downloadContract: jest.fn(() => Promise.resolve()),
  getPrimaryMember: jest.fn((membership: any) => membership.members[0]),
  getMonthlyEquivalent: jest.fn((plan: any) => {
    // Parse ISO duration to get months
    const match = plan.chargeInterval.match(/P(\d+)([YMW])/);
    if (!match) return plan.amount;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    let months = value;
    if (unit === 'Y') months = value * 12;
    return plan.amount / months;
  }),
  formatCurrency: jest.fn((amount: number, currency: string) => {
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  }),
  getStatusTranslationKey: jest.fn((status: string) => {
    const statusMap: Record<string, string> = {
      new: 'new',
      onboarding_started: 'onboardingStarted',
      active: 'active',
      paused: 'paused',
      cancelled: 'cancelled',
      defaulted: 'defaulted',
    };
    return statusMap[status] || status;
  }),
  isStatusActive: jest.fn((status: string) => status === 'active'),
  isStatusWarning: jest.fn((status: string) =>
    ['new', 'onboarding_started', 'paused', 'defaulted'].includes(status)
  ),
  isKnownRecurringInterval: jest.fn((duration: string) =>
    ['P1D', 'P1W', 'P2W', 'P1M', 'P3M', 'P6M', 'P12M', 'P18M', 'P24M', 'P1Y'].includes(duration)
  ),
  isKnownOnceDuration: jest.fn((duration: string) =>
    ['P1W', 'P1M', 'P2M', 'P3M', 'P6M', 'P12M', 'P18M', 'P24M', 'P1Y', 'P2Y'].includes(duration)
  ),
  parseDurationToMonths: jest.fn((duration: string) => {
    const match = duration.match(/P(\d+)([YMW])/);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'Y') return value * 12;
    if (unit === 'M') return value;
    if (unit === 'W') return Math.round(value / 4);
    return 0;
  }),
  getPendingDocumentRequests: jest.fn((membership: any) =>
    membership.documentRequests?.filter((doc: any) => doc.status === 'pending') || []
  ),
  getDocumentTypeTranslationKey: jest.fn((name: string) =>
    name.replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
  ),
  uploadDocument: jest.fn(() => Promise.resolve({ success: true, message: 'Uploaded' })),
  revertCancellation: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock the payment methods API
jest.mock('@/api/payment-methods', () => ({
  getPaymentMethod: jest.fn(() =>
    Promise.resolve({
      id: 1,
      prefixedId: 'PM-abc123',
      type: 'sepa',
      name: 'SEPA Direct Debit',
      code: 'sepa',
      isActive: true,
      isCorrectlyConfigured: true,
      last4: '3000',
      details: {
        accountHolder: 'John Doe',
        bankName: 'Test Bank',
        bic: 'DEUTDEDB',
        maskedIban: 'DE89 •••• •••• •••• •••• 00',
      },
      createdAt: '2024-01-15T00:00:00Z',
    })
  ),
  getPaymentMethodIcon: jest.fn((code: string) => {
    const icons: Record<string, string> = {
      sepa: 'Building',
      card: 'CreditCard',
      paypal: 'Wallet',
      invoice: 'FileText',
    };
    return icons[code] || 'CreditCard';
  }),
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
        expect(getByText('1000031')).toBeTruthy();
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
      const { getAllByText } = render(<MembershipScreen />);

      await waitFor(() => {
        // There may be multiple "Active" badges (membership status and payment method)
        const activeElements = getAllByText('Active');
        expect(activeElements.length).toBeGreaterThan(0);
      });
    });

    it('displays pricing information', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Pricing')).toBeTruthy();
        expect(getByText('€1068.00')).toBeTruthy();
        expect(getByText('€89.00/mo')).toBeTruthy();
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
        expect(downloadContract).toHaveBeenCalledWith(1000031);
      });
    });

    it('shows error alert when download fails', async () => {
      const { downloadContract } = require('@/api/membership');
      downloadContract.mockRejectedValueOnce(new Error('Download failed'));

      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        expect(getByText('Download Contract PDF')).toBeTruthy();
      });

      const downloadButton = getByText('Download Contract PDF');
      fireEvent.press(downloadButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
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
        // The screen should not crash - shows "No membership found" on error
        expect(queryByText('No membership found')).toBeTruthy();
      });

      consoleError.mockRestore();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', async () => {
      const { getByText } = render(<MembershipScreen />);

      await waitFor(() => {
        // Check that the start date is formatted (contains January)
        expect(getByText(/January 15, 2024/)).toBeTruthy();
      });
    });
  });
});
