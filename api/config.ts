// API Configuration
// This file contains the base configuration for API calls

import Constants from 'expo-constants';

// Get tenant from app config
const tenant = Constants.expoConfig?.extra?.tenant || 'evolve';

// Get current environment
const ENV = (Constants.expoConfig?.extra?.env || 'development') as 'development' | 'staging' | 'production';

// Base URLs per environment with tenant
const getApiUrl = (env: typeof ENV, tenantName: string): string => {
  switch (env) {
    case 'development':
      return `http://${tenantName}.sportsmanager.test/api`;
    case 'staging':
      return `https://${tenantName}.omoplata.eu/api`;
    case 'production':
      return `https://${tenantName}.omoplata.de/api`;
    default:
      return `http://${tenantName}.sportsmanager.test/api`;
  }
};

export const API_CONFIG = {
  baseUrl: getApiUrl(ENV, tenant),
  timeout: 30000, // 30 seconds
  tenant,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant': tenant,
  },
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
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
    LIST: '/memberships',
    DETAILS: (id: string) => `/memberships/${id}`,
    PLANS: '/memberships/plans',
    SUBSCRIBE: '/memberships/subscribe',
    CANCEL: (id: string) => `/memberships/${id}/cancel`,
    PAUSE: (id: string) => `/memberships/${id}/pause`,
    RESUME: (id: string) => `/memberships/${id}/resume`,
  },
  // Classes
  CLASSES: {
    LIST: '/classes',
    DETAILS: (id: string) => `/classes/${id}`,
    SCHEDULE: '/classes/schedule',
    BOOK: (id: string) => `/classes/${id}/book`,
    CANCEL_BOOKING: (id: string) => `/classes/${id}/cancel`,
  },
  // Check-in
  CHECKIN: {
    CREATE: '/checkin',
    HISTORY: '/checkin/history',
    QR_CODE: '/checkin/qr-code',
  },
  // Payments
  PAYMENTS: {
    METHODS: '/payments/methods',
    ADD_METHOD: '/payments/methods',
    DELETE_METHOD: (id: string) => `/payments/methods/${id}`,
    INVOICES: '/payments/invoices',
    PAY_INVOICE: (id: string) => `/payments/invoices/${id}/pay`,
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
  },
} as const;

export default API_CONFIG;
