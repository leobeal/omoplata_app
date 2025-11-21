import profileData from '@/data/profile.json';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
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
  medications: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface Preferences {
  language: string;
  notifications: NotificationPreferences;
  newsletter: boolean;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: Address;
  emergencyContact: EmergencyContact;
  medicalInfo: MedicalInfo;
  preferences: Preferences;
  avatar: string | null;
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: Partial<Address>;
  emergencyContact?: Partial<EmergencyContact>;
  medicalInfo?: Partial<MedicalInfo>;
  preferences?: Partial<Preferences>;
}

/**
 * Fetch user profile
 */
export const getProfile = async (): Promise<Profile> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return profileData as Profile;
};

/**
 * Update user profile
 */
export const updateProfile = async (updates: ProfileUpdate): Promise<Profile> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In a real app, this would send the updates to the backend
  // For now, we'll merge the updates with the existing profile
  const currentProfile = profileData as Profile;
  const updatedProfile = {
    ...currentProfile,
    ...updates,
    address: { ...currentProfile.address, ...updates.address },
    emergencyContact: { ...currentProfile.emergencyContact, ...updates.emergencyContact },
    medicalInfo: { ...currentProfile.medicalInfo, ...updates.medicalInfo },
    preferences: { ...currentProfile.preferences, ...updates.preferences },
  };

  return updatedProfile;
};
