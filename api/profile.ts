import { api } from './client';
import { ENDPOINTS } from './config';

// API Response Types (snake_case as returned by backend)
interface ApiAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface ApiResponsible {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  relationship: string;
}

interface ApiUserResponse {
  id: string;
  prefixed_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  nickname: string | null;
  member_number: string;
  email: string;
  gender: string | null;
  locale: string;
  phone_country_code: string | null;
  phone: string | null;
  date_of_birth: string | null;
  profile_picture: string | null;
  requires_payer: boolean;
  address: ApiAddress | null;
  responsibles: ApiResponsible[];
  primary_responsible: ApiResponsible | null;
  children: ApiResponsible[];
}

// Internal Types (camelCase for app use)
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Responsible {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  relationship: string;
}

export interface Profile {
  id: string;
  prefixedId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string | null;
  memberNumber: string;
  email: string;
  gender: string | null;
  locale: string;
  phoneCountryCode: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  profilePicture: string | null;
  requiresPayer: boolean;
  address: Address | null;
  responsibles: Responsible[];
  primaryResponsible: Responsible | null;
  children: Responsible[];
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  gender?: string;
  phone_country_code?: string;
  phone?: string;
  date_of_birth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

/**
 * Transform API response to internal format
 */
const transformApiUser = (apiUser: ApiUserResponse): Profile => {
  return {
    id: apiUser.id,
    prefixedId: apiUser.prefixed_id,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    fullName: apiUser.full_name,
    nickname: apiUser.nickname,
    memberNumber: apiUser.member_number,
    email: apiUser.email,
    gender: apiUser.gender,
    locale: apiUser.locale,
    phoneCountryCode: apiUser.phone_country_code,
    phone: apiUser.phone,
    dateOfBirth: apiUser.date_of_birth,
    profilePicture: apiUser.profile_picture,
    requiresPayer: apiUser.requires_payer,
    address: apiUser.address
      ? {
          street: apiUser.address.street,
          city: apiUser.address.city,
          state: apiUser.address.state,
          postalCode: apiUser.address.postal_code,
          country: apiUser.address.country,
        }
      : null,
    responsibles: apiUser.responsibles.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      relationship: r.relationship,
    })),
    primaryResponsible: apiUser.primary_responsible
      ? {
          id: apiUser.primary_responsible.id,
          firstName: apiUser.primary_responsible.first_name,
          lastName: apiUser.primary_responsible.last_name,
          email: apiUser.primary_responsible.email,
          relationship: apiUser.primary_responsible.relationship,
        }
      : null,
    children: apiUser.children.map((c) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      relationship: c.relationship,
    })),
  };
};

/**
 * Fetch current user profile
 */
export const getProfile = async (): Promise<Profile> => {
  const response = await api.get<{ user: ApiUserResponse }>(ENDPOINTS.USERS.ME);
  return transformApiUser(response.data.user);
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdateRequest
): Promise<Profile> => {
  const response = await api.put<{ user: ApiUserResponse }>(
    ENDPOINTS.USERS.UPDATE.replace(':id', userId),
    updates
  );
  return transformApiUser(response.data.user);
};
