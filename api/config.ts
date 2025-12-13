// API Configuration
// This file contains the base configuration for API calls

import Constants from 'expo-constants';

// Get current environment
const ENV = (Constants.expoConfig?.extra?.env || 'development') as
  | 'development'
  | 'staging'
  | 'production';

// Base URLs per environment with tenant slug
const getApiUrl = (env: typeof ENV, tenant: string): string => {
  switch (env) {
    case 'development':
      return `https://${tenant}.sportsmanager.test/api`;
    case 'staging':
      return `https://${tenant}.omoplata.eu/api`;
    case 'production':
      return `https://${tenant}.omoplata.de/api`;
    default:
      return `https://${tenant}.sportsmanager.test/api`;
  }
};

// Runtime tenant - can be updated via setTenant()
let currentTenant = Constants.expoConfig?.extra?.tenant || 'evolve';

/**
 * Update the current tenant at runtime
 * This is used when the app is in multi-tenant mode
 */
export const setTenant = (tenant: string) => {
  currentTenant = tenant;
};

/**
 * Get the current tenant slug
 */
export const getTenant = (): string => {
  return currentTenant;
};

/**
 * Get the current API base URL (dynamically calculated)
 */
export const getBaseUrl = (): string => {
  return getApiUrl(ENV, currentTenant);
};

export const API_CONFIG = {
  get baseUrl(): string {
    return getBaseUrl();
  },
  timeout: 30000, // 30 seconds - allows background requests to complete after cache fallback
  get tenant(): string {
    return getTenant();
  },
  get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Tenant': getTenant(),
    };
  },
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
  },
  // Users
  USERS: {
    ME: '/users/me',
    UPDATE: '/users/:id',
    SWITCH_TO_CHILD: (childId: string) => `/users/${childId}/switch`,
    ACTIVITY_STATS: '/users/activity-stats',
  },
  // User
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    UPLOAD_AVATAR: '/user/avatar',
  },
  // Memberships
  MEMBERSHIPS: {
    CURRENT: '/memberships/current',
    LIST: '/memberships',
    DETAILS: (id: string) => `/memberships/${id}`,
    PLANS: '/memberships/plans',
    SUBSCRIBE: '/memberships/subscribe',
    CANCEL: (id: string) => `/memberships/${id}/cancel`,
    REVERT_CANCEL: (id: string) => `/memberships/${id}/revert-cancel`,
    PAUSE: (id: string) => `/memberships/${id}/pause`,
    RESUME: (id: string) => `/memberships/${id}/resume`,
    DOWNLOAD_CONTRACT: (id: number) => `/memberships/${id}/contract/download`,
  },
  // Classes
  CLASSES: {
    LIST: '/classes',
    DETAILS: (id: string) => `/classes/${id}`,
  },
  // Attendance Intentions
  ATTENDANCE: {
    CREATE_INTENTION: '/attendance-intentions',
  },
  // Check-in
  CHECKIN: {
    CREATE: '/checkin',
    HISTORY: '/checkin/history',
    STATS: '/checkin/stats',
    QR_CODE: '/checkin/qr-code',
  },
  // Invoices
  INVOICES: {
    LIST: '/invoices',
    DOWNLOAD: (id: string) => `/invoices/${id}/download`,
  },
  // Graduations
  GRADUATIONS: {
    LIST: '/graduations',
  },
  // App Config
  CONFIG: {
    APP: '/config/app',
  },
  // Tenant Check (unauthenticated)
  TENANT: {
    CHECK: '/check',
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
  },
  // Push Notifications
  PUSH: {
    REGISTER_TOKEN: '/push/register',
    UNREGISTER_TOKEN: '/push/unregister',
  },
  // Analytics
  STATISTICS: {
    DASHBOARD: '/analytics',
  },
  // Leaderboard
  LEADERBOARD: {
    LIST: '/leaderboard',
  },
  // FAQs
  FAQS: {
    CLUB: '/faqs/club',
    APP: '/faqs/app',
  },
} as const;

export default API_CONFIG;
