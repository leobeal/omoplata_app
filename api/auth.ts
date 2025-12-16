// Auth API Service
// Handles authentication-related API calls

import { api, setAuthToken } from './client';
import { ENDPOINTS } from './config';

import { DeviceInfo } from '@/utils/device-info';

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

// Types
export interface LoginRequest {
  email: string;
  password: string;
  device?: DeviceInfo;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// App User format (camelCase for use in app)
// Note: API returns snake_case, which is transformed to camelCase
export interface User {
  id: string;
  prefixedId: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  phone?: string;
  profilePicture?: string;
  membershipId?: string;
  createdAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Auth API functions
export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, credentials);

    // Transform snake_case response to camelCase
    if (response.data) {
      response.data = transformToCamelCase(response.data) as LoginResponse;
    }

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest) => {
    const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.REGISTER, data);

    // Transform snake_case response to camelCase
    if (response.data) {
      response.data = transformToCamelCase(response.data) as LoginResponse;
    }

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Logout current user
   */
  logout: async () => {
    const response = await api.post(ENDPOINTS.AUTH.LOGOUT);
    setAuthToken(null);
    return response;
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (refreshToken: string) => {
    const response = await api.post<{ token: string }>(ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    });

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest) => {
    return api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest) => {
    return api.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
  },

  /**
   * Verify email address
   */
  verifyEmail: async (token: string) => {
    return api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  },
};

export default authApi;
