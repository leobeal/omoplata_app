import { api } from './client';
import { ENDPOINTS } from './config';

import { getDeviceInfo } from '@/utils/device-info';

// Request OTP types
export interface RequestOtpResponse {
  message: string;
}

export interface RequestOtpRateLimitedResponse {
  message: string;
  retry_after: number;
}

// Verify OTP types
export interface VerifyOtpRequest {
  email: string;
  code: string;
  device_name: string;
}

export interface VerifyOtpUser {
  id: string;
  prefixed_id: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  phone?: string;
  profile_picture?: string;
  membership_id?: string;
}

export interface VerifyOtpResponse {
  message: string;
  user: VerifyOtpUser;
  token: string;
}

export interface OtpError {
  message: string;
  retry_after?: number;
}

/**
 * Parse retry time from response (body or headers)
 */
function parseRetryAfter(
  data: RequestOtpRateLimitedResponse | undefined,
  headers?: Record<string, string>
): number | undefined {
  // First check body
  if (data?.retry_after) {
    return data.retry_after;
  }

  // Then check headers
  if (headers) {
    // Retry-After can be seconds or a date
    const retryAfter = headers['Retry-After'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds;
      }
      // Try parsing as date
      const date = new Date(retryAfter);
      if (!isNaN(date.getTime())) {
        return Math.ceil((date.getTime() - Date.now()) / 1000);
      }
    }

    // X-RateLimit-Reset is usually a Unix timestamp
    const rateLimitReset = headers['X-RateLimit-Reset'];
    if (rateLimitReset) {
      const timestamp = parseInt(rateLimitReset, 10);
      if (!isNaN(timestamp)) {
        // Check if it's seconds or milliseconds
        const resetTime = timestamp > 1e12 ? timestamp : timestamp * 1000;
        return Math.ceil((resetTime - Date.now()) / 1000);
      }
    }
  }

  return undefined;
}

/**
 * Request an OTP code to be sent to the user's email
 */
export async function requestOtp(
  email: string
): Promise<
  | { success: true }
  | { success: false; error: string; retryAfter?: number; isRateLimited?: boolean }
> {
  const response = await api.post<RequestOtpResponse | RequestOtpRateLimitedResponse>(
    ENDPOINTS.OTP.REQUEST,
    { email }
  );

  if (response.error) {
    const data = response.data as RequestOtpRateLimitedResponse | undefined;
    const retryAfter = parseRetryAfter(data, response.headers);

    return {
      success: false,
      error: response.error,
      retryAfter,
      isRateLimited: response.status === 429,
    };
  }

  return { success: true };
}

/**
 * Verify an OTP code and get auth token
 */
export async function verifyOtp(
  email: string,
  code: string
): Promise<
  | { success: true; user: VerifyOtpUser; token: string }
  | { success: false; error: string; retryAfter?: number; isRateLimited?: boolean }
> {
  // Get device info for the request
  const deviceInfo = await getDeviceInfo();
  const deviceName = `${deviceInfo.modelName || deviceInfo.platform} (${deviceInfo.osVersion})`;

  const response = await api.post<VerifyOtpResponse>(ENDPOINTS.OTP.VERIFY, {
    email,
    code,
    device_name: deviceName,
  });

  if (response.error) {
    const data = response.data as unknown as RequestOtpRateLimitedResponse | undefined;
    const retryAfter = parseRetryAfter(data, response.headers);

    return {
      success: false,
      error: response.error,
      retryAfter,
      isRateLimited: response.status === 429,
    };
  }

  if (!response.data) {
    return {
      success: false,
      error: 'Invalid response from server',
    };
  }

  return {
    success: true,
    user: response.data.user,
    token: response.data.token,
  };
}

export const otpApi = {
  requestOtp,
  verifyOtp,
};
