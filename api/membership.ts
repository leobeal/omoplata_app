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
function transformToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformToCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = transformToCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContractPrice {
  amount: number;
  currency: string;
  billingCycle: string;
  monthlyEquivalent: number;
}

export interface Contract {
  id: string;
  type: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  startDate: string;
  endDate: string;
  renewalDate: string;
  autoRenewal: boolean;
  price: ContractPrice;
  cancellationPolicy: string;
  freezePolicy: string;
  transferPolicy: string;
  nextCancellationDate: string; // Earliest date when cancellation can be requested
}

export interface PaymentMethod {
  type: string;
  iban: string;
  accountHolder: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface MedicalInfo {
  bloodType: string;
  allergies: string;
  conditions: string;
  lastCheckup: string;
}

export interface Membership {
  memberId: string;
  memberName: string;
  email: string;
  phone: string;
  address: Address;
  contract: Contract;
  paymentMethod: PaymentMethod;
  emergencyContact: EmergencyContact;
  medicalInfo: MedicalInfo;
}

/**
 * Fetch membership data
 */
export const getMembership = async (): Promise<Membership> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return transformToCamelCase(membershipData) as Membership;
};

/**
 * Download contract PDF (simulated)
 */
export const downloadContract = async (contractId: string): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // In a real app, this would return a PDF URL or blob
  return `https://api.omoplata.com/contracts/${contractId}/download`;
};

/**
 * Cancel membership (simulated)
 * @param contractId - The contract ID to cancel
 * @param cancellationDate - The effective cancellation date (must be >= nextCancellationDate)
 * @param reason - Optional cancellation reason
 */
export const cancelMembership = async (
  contractId: string,
  cancellationDate: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real app, this would call your backend API:
  // const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/cancel`, {
  //   method: 'POST',
  //   body: JSON.stringify({ cancellationDate, reason })
  // });
  // return response.json();

  return {
    success: true,
    message: `Membership will be cancelled effective ${cancellationDate}`,
  };
};
