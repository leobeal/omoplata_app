import membershipData from '@/data/membership.json';

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
  return membershipData as Membership;
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
