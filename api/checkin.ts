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

export interface CheckinFacility {
  id: number;
  name: string;
}

export interface CheckinVenue {
  id: number;
  name: string;
  address: string | null;
  facility: CheckinFacility | null;
}

export interface CheckinClass {
  id: number;
  name: string;
  startsAt: string;
  endsAt: string;
}

export interface CheckinData {
  checkinId?: string;
  userId: string;
  venue: CheckinVenue | null;
  class?: CheckinClass | null;
  checkedInAt?: string;
  checkedOutAt?: string | null;
  membership: {
    status: string | null;
    planName: string | null;
  };
  greeting: string;
  todayVisitNumber: number;
  weeklyVisits: number;
  monthlyVisits: number;
  // Fields when success: false
  alternatives?: NoClassesAlternative[];
  upcomingHere?: NoClassesUpcoming[];
  error?: string;
  message?: string;
}

// Response when no classes are available at scanned location
export interface NoClassesAlternative {
  facilityId: string;
  venue: string;
  facility?: string | null;
  nextClassAt: string;
  className?: string;
  sameVenue: boolean; // true if same venue, user can tap to check in
}

export interface NoClassesUpcoming {
  className: string;
  startsAt: string;
  facility?: string | null;
  venue?: string | null;
}

export interface NoClassesAvailableData {
  venue: CheckinVenue | null;
  alternatives?: NoClassesAlternative[];
  upcomingHere?: NoClassesUpcoming[];
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
interface ApiFacility {
  id: number;
  name: string;
}

interface ApiVenue {
  id: number;
  name: string;
  address: string | null;
  facility: ApiFacility | null;
}

interface ApiCheckinClass {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
}

interface ApiCheckinData {
  checkin_id?: string;
  user_id: string;
  venue?: ApiVenue | null;
  class?: ApiCheckinClass | null;
  checked_in_at?: string;
  checked_out_at?: string | null;
  membership?: {
    status: string | null;
    plan_name: string | null;
  };
  greeting?: string;
  today_visit_number?: number;
  weekly_visits?: number;
  monthly_visits?: number;
  // Fields when success: false
  alternatives?: ApiNoClassesAlternative[];
  upcoming_here?: ApiNoClassesUpcoming[];
  error?: string;
  message?: string;
}

interface ApiNoClassesAlternative {
  facility_id: string;
  venue: string;
  facility?: string | null;
  next_class_at: string;
  class_name?: string;
  same_venue: boolean;
}

interface ApiNoClassesUpcoming {
  class_name: string;
  starts_at: string;
}

interface ApiNoClassesAvailableData {
  venue?: ApiVenue | null;
  alternatives?: ApiNoClassesAlternative[];
  upcoming_here?: ApiNoClassesUpcoming[];
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
function transformVenue(venue: ApiVenue | null | undefined): CheckinVenue | null {
  if (!venue) return null;
  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    facility: venue.facility
      ? {
          id: venue.facility.id,
          name: venue.facility.name,
        }
      : null,
  };
}

function transformCheckinData(data: ApiCheckinData): CheckinData {
  return {
    checkinId: data.checkin_id,
    userId: data.user_id,
    venue: transformVenue(data.venue),
    class: data.class
      ? {
          id: data.class.id,
          name: data.class.name,
          startsAt: data.class.starts_at,
          endsAt: data.class.ends_at,
        }
      : null,
    checkedInAt: data.checked_in_at,
    checkedOutAt: data.checked_out_at ?? null,
    membership: {
      status: data.membership.status,
      planName: data.membership.plan_name,
    },
    greeting: data.greeting,
    todayVisitNumber: data.today_visit_number,
    weeklyVisits: data.weekly_visits,
    monthlyVisits: data.monthly_visits,
    // No classes available fields
    alternatives: data.alternatives?.map((alt) => ({
      facilityId: alt.facility_id,
      venue: alt.venue,
      facility: alt.facility,
      nextClassAt: alt.next_class_at,
      className: alt.class_name,
      sameVenue: alt.same_venue,
    })),
    upcomingHere: data.upcoming_here?.map((item) => ({
      className: item.class_name,
      startsAt: item.starts_at,
    })),
  };
}

export function transformNoClassesData(data: ApiNoClassesAvailableData): NoClassesAvailableData {
  return {
    venue: transformVenue(data.venue),
    alternatives: (data.alternatives || []).map((alt) => ({
      facilityId: alt.facility_id,
      venue: alt.venue,
      facility: alt.facility,
      nextClassAt: alt.next_class_at,
      className: alt.class_name,
      sameVenue: alt.same_venue,
    })),
    upcomingHere: (data.upcoming_here || []).map((item) => ({
      className: item.class_name,
      startsAt: item.starts_at,
    })),
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

    console.log('[Checkin API] Full response:', JSON.stringify(response, null, 2));

    if (response.error || !response.data) {
      return { error: response.error || 'Failed to check in' };
    }

    // When success is false, the data structure is different (no membership, greeting, etc.)
    // Only transform the venue and pass through alternatives/upcomingHere/error/message
    if (!response.data.success) {
      const data = response.data.data;
      return {
        data: {
          success: false,
          data: {
            userId: data.user_id,
            venue: transformVenue(data.venue),
            membership: { status: null, planName: null },
            greeting: '',
            todayVisitNumber: 0,
            weeklyVisits: 0,
            monthlyVisits: 0,
            alternatives: data.alternatives?.map((alt) => ({
              facilityId: alt.facility_id,
              venue: alt.venue,
              facility: alt.facility,
              nextClassAt: alt.next_class_at,
              className: alt.class_name,
              sameVenue: alt.same_venue,
            })),
            upcomingHere: data.upcoming_here?.map((item) => ({
              className: item.class_name,
              startsAt: item.starts_at,
            })),
            error: data.error,
            message: data.message,
          },
        },
      };
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
