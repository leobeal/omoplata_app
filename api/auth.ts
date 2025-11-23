// Auth API Service
// Handles authentication-related API calls

import { api, setAuthToken } from './client';
import { ENDPOINTS } from './config';

// Types
export interface LoginRequest {
  email: string;
  password: string;
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

// API Response format (camelCase as returned by backend)
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
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
