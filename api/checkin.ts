import { api } from './client';
import { ENDPOINTS } from './config';

// App Types (camelCase)
export interface CheckinRequest {
  method: 'qr_code' | 'manual';
  locationId: string;
  qrCode?: string;
  membershipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface CheckinData {
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
}

export interface CheckinResponse {
  success: boolean;
  data: CheckinData;
}

export interface CheckinHistoryItem {
  id: string;
  location: {
    id: string;
    name: string;
  };
  checkedInAt: string;
  checkedOutAt: string | null;
  duration: number;
}

export interface CheckinHistoryResponse {
  success: boolean;
  data: CheckinHistoryItem[];
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

// API Types (snake_case from backend)
interface ApiCheckinData {
  checkin_id: string;
  user_id: string;
  location: {
    id: string;
    name: string;
    address: string;
  };
  checked_in_at: string;
  checked_out_at: string | null;
  membership: {
    status: string;
    plan_name: string;
  };
  greeting: string;
  today_visit_number: number;
  weekly_visits: number;
  monthly_visits: number;
}

interface ApiCheckinResponse {
  success: boolean;
  data: ApiCheckinData;
}

interface ApiCheckinHistoryItem {
  id: string;
  location: {
    id: string;
    name: string;
  };
  checked_in_at: string;
  checked_out_at: string | null;
  duration: number;
}

interface ApiCheckinHistoryResponse {
  success: boolean;
  data: ApiCheckinHistoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  summary: {
    total_visits: number;
    total_duration: number;
    average_duration: number;
    this_week: number;
    this_month: number;
  };
}

interface ApiCheckinStatsResponse {
  success: boolean;
  data: {
    period: string;
    start_date: string;
    end_date: string;
    stats: {
      total_visits: number;
      total_duration: number;
      average_duration: number;
      longest_session: number;
      shortest_session: number;
      most_visited_day: string;
      preferred_time: string;
      streak: {
        current: number;
        longest: number;
      };
    };
    by_day: Record<string, number>;
    by_time: Record<string, number>;
    weekly_trend: {
      week: string;
      visits: number;
    }[];
  };
}

interface ApiActiveCheckinResponse {
  success: boolean;
  data: {
    is_checked_in: boolean;
    checkin?: {
      id: string;
      location: {
        id: string;
        name: string;
      };
      checked_in_at: string;
      duration: number;
    };
    last_checkin?: {
      id: string;
      location: string;
      checked_out_at: string;
    };
  };
}

// Transform functions
function transformCheckinData(data: ApiCheckinData): CheckinData {
  return {
    checkinId: data.checkin_id,
    userId: data.user_id,
    location: data.location,
    checkedInAt: data.checked_in_at,
    checkedOutAt: data.checked_out_at,
    membership: {
      status: data.membership.status,
      planName: data.membership.plan_name,
    },
    greeting: data.greeting,
    todayVisitNumber: data.today_visit_number,
    weeklyVisits: data.weekly_visits,
    monthlyVisits: data.monthly_visits,
  };
}

function transformHistoryItem(item: ApiCheckinHistoryItem): CheckinHistoryItem {
  return {
    id: item.id,
    location: item.location,
    checkedInAt: item.checked_in_at,
    checkedOutAt: item.checked_out_at,
    duration: item.duration,
  };
}

function transformHistoryResponse(response: ApiCheckinHistoryResponse): CheckinHistoryResponse {
  return {
    success: response.success,
    data: response.data.map(transformHistoryItem),
    meta: response.meta,
    summary: {
      totalVisits: response.summary.total_visits,
      totalDuration: response.summary.total_duration,
      averageDuration: response.summary.average_duration,
      thisWeek: response.summary.this_week,
      thisMonth: response.summary.this_month,
    },
  };
}

function transformStatsResponse(response: ApiCheckinStatsResponse): CheckinStatsResponse {
  return {
    success: response.success,
    data: {
      period: response.data.period,
      startDate: response.data.start_date,
      endDate: response.data.end_date,
      stats: {
        totalVisits: response.data.stats.total_visits,
        totalDuration: response.data.stats.total_duration,
        averageDuration: response.data.stats.average_duration,
        longestSession: response.data.stats.longest_session,
        shortestSession: response.data.stats.shortest_session,
        mostVisitedDay: response.data.stats.most_visited_day,
        preferredTime: response.data.stats.preferred_time,
        streak: response.data.stats.streak,
      },
      byDay: response.data.by_day,
      byTime: response.data.by_time,
      weeklyTrend: response.data.weekly_trend,
    },
  };
}

function transformActiveResponse(response: ApiActiveCheckinResponse): ActiveCheckinResponse {
  return {
    success: response.success,
    data: {
      isCheckedIn: response.data.is_checked_in,
      checkin: response.data.checkin
        ? {
            id: response.data.checkin.id,
            location: response.data.checkin.location,
            checkedInAt: response.data.checkin.checked_in_at,
            duration: response.data.checkin.duration,
          }
        : undefined,
      lastCheckin: response.data.last_checkin
        ? {
            id: response.data.last_checkin.id,
            location: response.data.last_checkin.location,
            checkedOutAt: response.data.last_checkin.checked_out_at,
          }
        : undefined,
    },
  };
}

export const checkinApi = {
  /**
   * Create a new check-in
   */
  checkin: async (request: CheckinRequest): Promise<{ data?: CheckinResponse; error?: string }> => {
    const response = await api.post<ApiCheckinResponse>(ENDPOINTS.CHECKIN.CREATE, {
      method: request.method,
      location_id: request.locationId,
      qr_code: request.qrCode,
      membership_code: request.membershipCode,
      latitude: request.latitude,
      longitude: request.longitude,
    });

    if (response.error || !response.data) {
      return { error: response.error || 'Failed to check in' };
    }

    return {
      data: {
        success: response.data.success,
        data: transformCheckinData(response.data.data),
      },
    };
  },

  /**
   * Check out from gym
   */
  checkout: async (checkinId: string) => {
    return api.post(`${ENDPOINTS.CHECKIN.CREATE}/checkout`, { checkin_id: checkinId });
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
  }): Promise<{ data?: CheckinHistoryResponse; error?: string }> => {
    const apiParams: Record<string, string> = {};
    if (params?.startDate) apiParams.start_date = params.startDate;
    if (params?.endDate) apiParams.end_date = params.endDate;
    if (params?.locationId) apiParams.location_id = params.locationId;
    if (params?.page) apiParams.page = String(params.page);
    if (params?.limit) apiParams.limit = String(params.limit);

    const queryParams = new URLSearchParams(apiParams).toString();
    const endpoint = queryParams
      ? `${ENDPOINTS.CHECKIN.HISTORY}?${queryParams}`
      : ENDPOINTS.CHECKIN.HISTORY;

    const response = await api.get<ApiCheckinHistoryResponse>(endpoint);

    if (response.error || !response.data) {
      return { error: response.error || 'Failed to fetch history' };
    }

    return { data: transformHistoryResponse(response.data) };
  },

  /**
   * Get check-in statistics
   */
  getStats: async (
    period?: 'week' | 'month' | 'year' | 'all'
  ): Promise<{ data?: CheckinStatsResponse; error?: string }> => {
    const endpoint = period
      ? `${ENDPOINTS.CHECKIN.STATS}?period=${period}`
      : ENDPOINTS.CHECKIN.STATS;

    const response = await api.get<ApiCheckinStatsResponse>(endpoint);

    if (response.error || !response.data) {
      return { error: response.error || 'Failed to fetch stats' };
    }

    return { data: transformStatsResponse(response.data) };
  },

  /**
   * Check if user is currently checked in
   */
  getActive: async (): Promise<{ data?: ActiveCheckinResponse; error?: string }> => {
    const response = await api.get<ApiActiveCheckinResponse>(`${ENDPOINTS.CHECKIN.CREATE}/active`);

    if (response.error || !response.data) {
      return { error: response.error || 'Failed to fetch active checkin' };
    }

    return { data: transformActiveResponse(response.data) };
  },

  /**
   * Generate QR code for member check-in
   */
  generateQRCode: async () => {
    return api.get(ENDPOINTS.CHECKIN.QR_CODE);
  },
};
