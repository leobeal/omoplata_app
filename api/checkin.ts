import { api } from './client';
import { ENDPOINTS } from './config';

export interface CheckinRequest {
  method: 'qr_code' | 'manual';
  locationId: string;
  qrCode?: string;
  membershipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface CheckinResponse {
  success: boolean;
  data: {
    checkinId: string;
    userId: string;
    location: {
      id: string;
      name: string;
      address: string;
    };
    checkedInAt: string;
    checkedOutAt: string | null;
    membership: {
      status: string;
      planName: string;
    };
    greeting: string;
    todayVisitNumber: number;
    weeklyVisits: number;
    monthlyVisits: number;
  };
}

export interface CheckinHistoryResponse {
  success: boolean;
  data: {
    id: string;
    location: {
      id: string;
      name: string;
    };
    checkedInAt: string;
    checkedOutAt: string | null;
    duration: number;
  }[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  summary: {
    totalVisits: number;
    totalDuration: number;
    averageDuration: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export interface CheckinStatsResponse {
  success: boolean;
  data: {
    period: string;
    startDate: string;
    endDate: string;
    stats: {
      totalVisits: number;
      totalDuration: number;
      averageDuration: number;
      longestSession: number;
      shortestSession: number;
      mostVisitedDay: string;
      preferredTime: string;
      streak: {
        current: number;
        longest: number;
      };
    };
    byDay: Record<string, number>;
    byTime: Record<string, number>;
    weeklyTrend: {
      week: string;
      visits: number;
    }[];
  };
}

export interface ActiveCheckinResponse {
  success: boolean;
  data: {
    isCheckedIn: boolean;
    checkin?: {
      id: string;
      location: {
        id: string;
        name: string;
      };
      checkedInAt: string;
      duration: number;
    };
    lastCheckin?: {
      id: string;
      location: string;
      checkedOutAt: string;
    };
  };
}

export const checkinApi = {
  /**
   * Create a new check-in
   */
  checkin: async (request: CheckinRequest) => {
    return api.post<CheckinResponse>(ENDPOINTS.CHECKIN.CREATE, request);
  },

  /**
   * Check out from gym
   */
  checkout: async (checkinId: string) => {
    return api.post(`${ENDPOINTS.CHECKIN.CREATE}/checkout`, { checkinId });
  },

  /**
   * Get check-in history
   */
  getHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    const endpoint = queryParams
      ? `${ENDPOINTS.CHECKIN.HISTORY}?${queryParams}`
      : ENDPOINTS.CHECKIN.HISTORY;

    return api.get<CheckinHistoryResponse>(endpoint);
  },

  /**
   * Get check-in statistics
   */
  getStats: async (period?: 'week' | 'month' | 'year' | 'all') => {
    const endpoint = period
      ? `${ENDPOINTS.CHECKIN.STATS}?period=${period}`
      : ENDPOINTS.CHECKIN.STATS;
    return api.get<CheckinStatsResponse>(endpoint);
  },

  /**
   * Check if user is currently checked in
   */
  getActive: async () => {
    return api.get<ActiveCheckinResponse>(`${ENDPOINTS.CHECKIN.CREATE}/active`);
  },

  /**
   * Generate QR code for member check-in
   */
  generateQRCode: async () => {
    return api.get(ENDPOINTS.CHECKIN.QR_CODE);
  },
};
