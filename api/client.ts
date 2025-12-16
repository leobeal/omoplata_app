// API Client
// Centralized HTTP client for making API requests

import { API_CONFIG } from './config';

import { getCurrentLocale } from '@/contexts/LocalizationContext';
import { generateSignatureHeaders, extractPath } from '@/utils/request-signing';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// Token storage (will be replaced with secure storage later)
let authToken: string | null = null;

// Callback for handling 401 responses (set by AuthProvider)
let onUnauthorizedCallback: (() => void) | null = null;
let isHandling401 = false; // Prevent multiple 401 handlers from firing

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

/**
 * Register a callback to be called when a 401 response is received.
 * This is used by AuthProvider to trigger logout on invalid tokens.
 */
export const setOnUnauthorized = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

// Check if running in development mode
const __DEV__ = process.env.NODE_ENV === 'development' || __DEV__;

// Main API request function
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, timeout = API_CONFIG.timeout } = options;

  const url = `${API_CONFIG.baseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    ...API_CONFIG.headers,
    ...headers,
  };

  // Add language header for all requests
  const locale = getCurrentLocale();
  requestHeaders['Accept-Language'] = locale;

  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  // Add request signature headers for security
  const path = extractPath(endpoint);
  const signatureHeaders = generateSignatureHeaders(method, path, body);
  requestHeaders['X-Timestamp'] = signatureHeaders['X-Timestamp'];
  requestHeaders['X-Signature'] = signatureHeaders['X-Signature'];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    if (__DEV__) console.log(`[API] ${method} ${url}`);
    const startTime = Date.now();

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      if (__DEV__) console.log(`[API] ${method} ${url} - ${response.status} (${duration}ms)`);

      // Handle 401 Unauthorized - trigger logout callback
      // Only trigger if we had a token (user was logged in), not for failed login attempts
      // Use flag to prevent multiple parallel 401s from triggering multiple logouts
      if (response.status === 401 && authToken && onUnauthorizedCallback && !isHandling401) {
        isHandling401 = true;
        console.log('[API] 401 Unauthorized - triggering logout');
        onUnauthorizedCallback();
        // Reset flag after a short delay to allow for future 401s (e.g., after re-login)
        setTimeout(() => {
          isHandling401 = false;
        }, 1000);
      }

      return {
        data: null,
        error: data?.message || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    if (__DEV__) console.log(`[API] ${method} ${url} - ${response.status} (${duration}ms)`);
    return {
      data: data as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      if (__DEV__) console.log(`[API] ${method} ${url} - Timeout after ${timeout}ms`);
      return {
        data: null,
        error: 'Request timeout',
        status: 408,
      };
    }

    if (__DEV__) {
      console.log(
        `[API] ${method} ${url} - ${error instanceof Error ? error.message : 'Network error'}`
      );
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: { headers?: Record<string, string>; timeout?: number }) =>
    apiRequest<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: { headers?: Record<string, string>; timeout?: number }
  ) => apiRequest<T>(endpoint, { method: 'POST', body, ...options }),

  put: <T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: { headers?: Record<string, string>; timeout?: number }
  ) => apiRequest<T>(endpoint, { method: 'PUT', body, ...options }),

  patch: <T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: { headers?: Record<string, string>; timeout?: number }
  ) => apiRequest<T>(endpoint, { method: 'PATCH', body, ...options }),

  delete: <T>(endpoint: string, options?: { headers?: Record<string, string>; timeout?: number }) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};

export default api;
