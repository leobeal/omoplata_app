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
  id: string;
  name: string;
  priceId: string;
  priceName: string;
  amount: number;
  currency: string;
  chargeInterval: 'monthly' | 'yearly' | 'weekly';
  contractDuration: number; // in months
}

// Member interface - person included in the membership
export interface Member {
  id: string;
  prefixedId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'primary' | 'secondary' | 'dependent';
}

// Payer interface - person responsible for payment
export interface Payer {
  id: string;
  prefixedId: string;
  fullName: string;
}

// Main Membership interface
export interface Membership {
  id: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending';
  startsAt: string;
  chargeStartsAt: string;
  endsAt: string;
  renewsAt: string;
  renewsAutomatically: boolean;
  amount: number;
  currency: string;
  plan: Plan;
  members: Member[];
  payer: Payer;
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
 * Helper to get the primary member from a membership
 */
export const getPrimaryMember = (membership: Membership): Member | undefined => {
  return membership.members.find((m) => m.role === 'primary');
};

/**
 * Helper to calculate monthly equivalent from plan amount
 */
export const getMonthlyEquivalent = (plan: Plan): number => {
  switch (plan.chargeInterval) {
    case 'yearly':
      return plan.amount / 12;
    case 'monthly':
      return plan.amount;
    case 'weekly':
      return (plan.amount * 52) / 12;
    default:
      return plan.amount;
  }
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
