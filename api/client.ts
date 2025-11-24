// API Client
// Centralized HTTP client for making API requests

import { API_CONFIG } from './config';

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

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

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

  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(`[API Error] ${method} ${url} - Status: ${response.status}`);
      return {
        data: null,
        error: data?.message || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      data: data as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[API Timeout] ${method} ${url} - Request timed out after ${timeout}ms`);
      return {
        data: null,
        error: 'Request timeout',
        status: 408,
      };
    }

    console.error(
      `[API Error] ${method} ${url} - ${error instanceof Error ? error.message : 'Network error'}`
    );
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body?: Record<string, unknown>, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, headers }),

  put: <T>(endpoint: string, body?: Record<string, unknown>, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, headers }),

  patch: <T>(endpoint: string, body?: Record<string, unknown>, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
};

export default api;
