import { Membership } from './membership';

import { StoredUser } from '@/utils/auth-storage';

/**
 * Data structure for wallet pass
 */
export interface WalletPassData {
  memberId: string;
  memberName: string;
  memberNumber: string;
  memberPhoto: string | null;
  planName: string;
  membershipStatus: string;
  validFrom: string;
  validUntil: string | null;
  gymName: string;
  qrCodeData: string;
}

/**
 * Generate QR code data payload for member check-in
 * This format should be compatible with the gym's reception scanner
 */
export const generateQRData = (user: StoredUser, membership: Membership | null): string => {
  const payload = {
    type: 'member_checkin',
    memberId: user.prefixedId,
    memberNumber: user.memberNumber || user.prefixedId,
    timestamp: Date.now(),
  };

  return JSON.stringify(payload);
};

/**
 * Assemble wallet pass data from user and membership info
 */
export const getWalletPassData = (
  user: StoredUser,
  membership: Membership | null,
  gymName: string
): WalletPassData => {
  const memberName = `${user.firstName} ${user.lastName}`.trim();

  return {
    memberId: user.prefixedId,
    memberName,
    memberNumber: user.memberNumber || user.prefixedId,
    memberPhoto: user.profilePicture || null,
    planName: membership?.plan.name || 'Member',
    membershipStatus: membership?.status || 'active',
    validFrom: membership?.startsAt || new Date().toISOString(),
    validUntil: membership?.endsAt || membership?.renewsAt || null,
    gymName,
    qrCodeData: generateQRData(user, membership),
  };
};

/**
 * Format date for display on card
 */
export const formatCardDate = (dateString: string | null, locale: string = 'en'): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get status badge color based on membership status
 */
export const getStatusColor = (status: string): { bg: string; text: string; label: string } => {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: '#10B981', text: '#FFFFFF', label: 'Active' },
    new: { bg: '#F59E0B', text: '#FFFFFF', label: 'New' },
    onboarding_started: { bg: '#F59E0B', text: '#FFFFFF', label: 'Pending' },
    paused: { bg: '#6B7280', text: '#FFFFFF', label: 'Paused' },
    cancelled: { bg: '#EF4444', text: '#FFFFFF', label: 'Cancelled' },
    defaulted: { bg: '#EF4444', text: '#FFFFFF', label: 'Defaulted' },
  };

  return statusColors[status] || statusColors.active;
};

// Future: Apple Wallet pass generation (requires backend)
// export const getAppleWalletPass = async (membershipId: number): Promise<Blob> => {
//   const response = await api.get(ENDPOINTS.WALLET.APPLE_PASS(membershipId), {
//     responseType: 'blob',
//   });
//   return response.data;
// };

// Future: Google Wallet pass generation (requires backend)
// export const getGoogleWalletToken = async (membershipId: number): Promise<string> => {
//   const response = await api.get(ENDPOINTS.WALLET.GOOGLE_PASS(membershipId));
//   return response.data.token;
// };
