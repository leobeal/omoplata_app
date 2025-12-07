import membershipData from '@/data/membership.json';

/**
 * Convert snake_case keys to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform snake_case object to camelCase
 */
function transformToCamelCase<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map(transformToCamelCase) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const camelKey = toCamelCase(key);
        acc[camelKey] = transformToCamelCase((obj as Record<string, unknown>)[key]);
        return acc;
      },
      {} as Record<string, unknown>
    ) as T;
  }
  return obj as T;
}

// Plan interface - details about the subscription plan
export interface Plan {
  id: number;
  name: string;
  priceId: number;
  priceName: string | null;
  amount: number;
  currency: string;
  chargeInterval: string; // ISO 8601 duration (e.g., "P1M" = 1 month, "P1Y" = 1 year)
  contractDuration: string; // ISO 8601 duration (e.g., "P6M" = 6 months)
}

// Member interface - person included in the membership
export interface Member {
  id: number;
  prefixedId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'member' | 'owner' | 'admin';
}

// Payer interface - person responsible for payment
export interface Payer {
  id: number;
  prefixedId: string;
  fullName: string;
}

// Document type interface
export interface DocumentType {
  id: number;
  name: string;
}

// Document request status
export type DocumentRequestStatus = 'pending' | 'approved' | 'rejected';

// User reference in document request
export interface DocumentRequestUser {
  id: number;
  prefixedId: string;
  fullName: string;
}

// Document request interface
export interface DocumentRequest {
  id: number;
  ulid: string;
  status: DocumentRequestStatus;
  reason: string;
  note: string | null;
  uploadedAt: string | null;
  createdAt: string;
  documentType: DocumentType;
  user: DocumentRequestUser;
}

// Membership status type
export type MembershipStatus =
  | 'new' // Member created, hasn't started onboarding
  | 'onboarding_started' // Member saw onboarding but hasn't completed it
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'defaulted'; // Member defaulted on payments

// Main Membership interface
export interface Membership {
  id: number;
  status: MembershipStatus;
  startsAt: string;
  chargeStartsAt: string;
  endsAt: string | null;
  renewsAt: string | null;
  renewsAutomatically: boolean;
  amount: number;
  currency: string;
  plan: Plan;
  members: Member[];
  payer: Payer;
  documentRequests: DocumentRequest[];
}

// API Response wrapper
export interface MembershipResponse {
  membership: Membership;
}

/**
 * Fetch membership data
 */
export const getMembership = async (): Promise<Membership> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  const response = transformToCamelCase<MembershipResponse>(membershipData);
  return response.membership;
};

/**
 * Download contract PDF (simulated)
 */
export const downloadContract = async (membershipId: string): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // In a real app, this would return a PDF URL or blob
  return `https://api.omoplata.com/memberships/${membershipId}/contract/download`;
};

/**
 * Cancel membership (simulated)
 * @param membershipId - The membership ID to cancel
 * @param cancellationDate - The effective cancellation date
 * @param reason - Optional cancellation reason
 */
export const cancelMembership = async (
  membershipId: string,
  cancellationDate: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real app, this would call your backend API:
  // const response = await fetch(`${API_BASE_URL}/memberships/${membershipId}/cancel`, {
  //   method: 'POST',
  //   body: JSON.stringify({ cancellationDate, reason })
  // });
  // return response.json();

  console.log('Cancellation reason:', reason);

  return {
    success: true,
    message: `Membership will be cancelled effective ${cancellationDate}`,
  };
};

/**
 * Parse ISO 8601 duration string to months
 * Examples: "P1M" = 1, "P6M" = 6, "P1Y" = 12, "P2Y" = 24
 */
export const parseDurationToMonths = (duration: string): number => {
  const match = duration.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/);
  if (!match) return 0;

  const years = parseInt(match[1] || '0', 10);
  const months = parseInt(match[2] || '0', 10);
  const weeks = parseInt(match[3] || '0', 10);
  const days = parseInt(match[4] || '0', 10);

  // Convert everything to months (approximate for weeks/days)
  return years * 12 + months + Math.round(weeks / 4) + Math.round(days / 30);
};

/**
 * Known ISO 8601 duration codes for recurring intervals
 */
export const RECURRING_INTERVALS = [
  'P1D',
  'P1W',
  'P2W',
  'P1M',
  'P3M',
  'P6M',
  'P12M',
  'P18M',
  'P24M',
  'P1Y',
] as const;

/**
 * Known ISO 8601 duration codes for one-time durations
 */
export const ONCE_DURATIONS = [
  'P1W',
  'P1M',
  'P2M',
  'P3M',
  'P6M',
  'P12M',
  'P18M',
  'P24M',
  'P1Y',
  'P2Y',
] as const;

export type RecurringInterval = (typeof RECURRING_INTERVALS)[number];
export type OnceDuration = (typeof ONCE_DURATIONS)[number];

/**
 * Check if a duration is a known recurring interval
 */
export const isKnownRecurringInterval = (duration: string): duration is RecurringInterval => {
  return RECURRING_INTERVALS.includes(duration as RecurringInterval);
};

/**
 * Check if a duration is a known one-time duration
 */
export const isKnownOnceDuration = (duration: string): duration is OnceDuration => {
  return ONCE_DURATIONS.includes(duration as OnceDuration);
};

/**
 * Get translation key for recurring interval (charge_interval)
 * Returns the key to use with t(`frequency.recurring.${key}`)
 * Falls back to the duration string if not found
 */
export const getRecurringIntervalKey = (duration: string): string => {
  return isKnownRecurringInterval(duration) ? duration : duration;
};

/**
 * Get translation key for one-time duration (contract_duration)
 * Returns the key to use with t(`frequency.once.${key}`)
 * Falls back to the duration string if not found
 */
export const getOnceDurationKey = (duration: string): string => {
  return isKnownOnceDuration(duration) ? duration : duration;
};

/**
 * Get human-readable interval from ISO 8601 duration (English fallback)
 * Use getRecurringIntervalKey() with translations for localized output
 * @deprecated Use getRecurringIntervalKey() with t() for localized strings
 */
export const getIntervalLabel = (duration: string): string => {
  const fallbackMap: Record<string, string> = {
    P1D: 'daily',
    P1W: 'weekly',
    P2W: 'every 2 weeks',
    P1M: 'monthly',
    P3M: 'every 3 months',
    P6M: 'every 6 months',
    P12M: 'every 12 months',
    P18M: 'every 18 months',
    P24M: 'every 24 months',
    P1Y: 'yearly',
    P2Y: 'every 2 years',
  };
  return fallbackMap[duration] || duration;
};

/**
 * Helper to get the first member from a membership
 */
export const getPrimaryMember = (membership: Membership): Member | undefined => {
  return membership.members[0];
};

/**
 * Helper to calculate monthly equivalent from plan amount
 */
export const getMonthlyEquivalent = (plan: Plan): number => {
  const months = parseDurationToMonths(plan.chargeInterval);
  if (months === 0) return plan.amount;
  return plan.amount / months;
};

/**
 * Helper to format currency amount
 */
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Get translation key for membership status
 * Maps API status to translation key (snake_case to camelCase)
 */
export const getStatusTranslationKey = (status: MembershipStatus): string => {
  const statusMap: Record<MembershipStatus, string> = {
    new: 'new',
    onboarding_started: 'onboardingStarted',
    active: 'active',
    paused: 'paused',
    cancelled: 'cancelled',
    defaulted: 'defaulted',
  };
  return statusMap[status] || status;
};

/**
 * Check if membership status allows access to the gym
 */
export const isStatusActive = (status: MembershipStatus): boolean => {
  return status === 'active';
};

/**
 * Check if membership needs attention (action required)
 */
export const isStatusWarning = (status: MembershipStatus): boolean => {
  return ['new', 'onboarding_started', 'paused', 'defaulted'].includes(status);
};

/**
 * Get pending document requests from a membership
 */
export const getPendingDocumentRequests = (membership: Membership): DocumentRequest[] => {
  return membership.documentRequests?.filter((doc) => doc.status === 'pending') || [];
};

/**
 * Check if membership has pending document requests
 */
export const hasPendingDocumentRequests = (membership: Membership): boolean => {
  return getPendingDocumentRequests(membership).length > 0;
};

/**
 * Get translation key for document type name
 */
export const getDocumentTypeTranslationKey = (documentTypeName: string): string => {
  // Convert snake_case to camelCase for translation lookup
  return documentTypeName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Upload document for a document request (simulated)
 * @param documentRequestId - The document request ID
 * @param file - The file to upload (URI or base64)
 */
export const uploadDocument = async (
  documentRequestId: number,
  file: { uri: string; name: string; type: string }
): Promise<{ success: boolean; message: string }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // In a real app, this would upload to your backend:
  // const formData = new FormData();
  // formData.append('file', file);
  // const response = await fetch(`${API_BASE_URL}/document-requests/${documentRequestId}/upload`, {
  //   method: 'POST',
  //   body: formData,
  // });
  // return response.json();

  console.log('Uploading document:', documentRequestId, file.name);

  return {
    success: true,
    message: 'Document uploaded successfully',
  };
};
