import { api } from './client';
import { ENDPOINTS } from './config';
import { BeltConfig } from './graduations';

import { CACHE_KEYS, CACHE_DURATIONS, fetchWithCacheFallback } from '@/utils/local-cache';

// API response types (snake_case - matches backend JSON)
interface ApiUserRank {
  rank: number;
  total_users: number;
  points: number;
  classes_attended: number;
  streak_weeks: number;
}

interface ApiBeltConfig {
  colors: string[];
  stripe_layers?: { count: number; color: string }[];
  has_graduation_bar?: boolean;
  split_vertical?: boolean;
}

interface ApiLeaderboardEntry {
  id: string;
  rank: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  points: number;
  classes_attended: number;
  streak_weeks: number;
  top_discipline: string;
  belt: string | null;
  belt_config: ApiBeltConfig | null;
  trend: 'up' | 'down' | 'same';
  rank_change: number;
  is_opted_in?: boolean;
}

interface ApiLeaderboard {
  user_rank: ApiUserRank;
  time_period: string;
  entries: ApiLeaderboardEntry[];
}

interface ApiFilterOption {
  id: string;
  name: string;
}

interface ApiFilters {
  disciplines: ApiFilterOption[];
  time_periods: ApiFilterOption[];
  demographics: ApiFilterOption[];
}

interface ApiLeaderboardResponse {
  leaderboard: ApiLeaderboard;
  filters: ApiFilters;
}

// Internal types (camelCase - used in app)
export interface UserRank {
  rank: number;
  totalUsers: number;
  points: number;
  classesAttended: number;
  streakWeeks: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  points: number;
  classesAttended: number;
  streakWeeks: number;
  topDiscipline: string;
  belt: string | null;
  beltConfig: BeltConfig | null;
  trend: 'up' | 'down' | 'same';
  rankChange: number;
  isOptedIn: boolean;
}

export interface Leaderboard {
  userRank: UserRank;
  timePeriod: string;
  entries: LeaderboardEntry[];
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface LeaderboardFilters {
  disciplines: FilterOption[];
  timePeriods: FilterOption[];
  demographics: FilterOption[];
}

export interface LeaderboardResponse {
  leaderboard: Leaderboard;
  filters: LeaderboardFilters;
}

export interface LeaderboardParams {
  discipline?: string;
  timePeriod?: string;
  demographic?: string;
  limit?: number;
  offset?: number;
}

// Transform functions (snake_case -> camelCase)
const transformUserRank = (api: ApiUserRank): UserRank => ({
  rank: api.rank,
  totalUsers: api.total_users,
  points: api.points,
  classesAttended: api.classes_attended,
  streakWeeks: api.streak_weeks,
});

const transformBeltConfig = (api: ApiBeltConfig | null): BeltConfig | null => {
  if (!api) return null;
  return {
    colors: api.colors,
    stripeLayers: api.stripe_layers,
    hasGraduationBar: api.has_graduation_bar,
    splitVertical: api.split_vertical,
  };
};

const transformEntry = (api: ApiLeaderboardEntry): LeaderboardEntry => ({
  id: api.id,
  rank: api.rank,
  firstName: api.first_name,
  lastName: api.last_name,
  fullName: `${api.first_name} ${api.last_name}`,
  avatarUrl: api.avatar_url,
  points: api.points,
  classesAttended: api.classes_attended,
  streakWeeks: api.streak_weeks,
  topDiscipline: api.top_discipline,
  belt: api.belt,
  beltConfig: transformBeltConfig(api.belt_config),
  trend: api.trend,
  rankChange: api.rank_change,
  isOptedIn: api.is_opted_in !== false, // Default to true if not specified
});

const transformFilters = (api: ApiFilters): LeaderboardFilters => ({
  disciplines: api.disciplines,
  timePeriods: api.time_periods,
  demographics: api.demographics,
});

const transformLeaderboard = (api: ApiLeaderboard): Leaderboard => ({
  userRank: transformUserRank(api.user_rank),
  timePeriod: api.time_period,
  entries: api.entries.map(transformEntry),
});

const transformResponse = (api: ApiLeaderboardResponse): LeaderboardResponse => ({
  leaderboard: transformLeaderboard(api.leaderboard),
  filters: transformFilters(api.filters),
});

/**
 * Build query string from params
 */
const buildQueryString = (params?: LeaderboardParams): string => {
  if (!params) return '';

  const queryParams = new URLSearchParams();

  if (params.discipline && params.discipline !== 'all') {
    queryParams.append('discipline', params.discipline);
  }
  if (params.timePeriod) {
    queryParams.append('time_period', params.timePeriod);
  }
  if (params.demographic && params.demographic !== 'all') {
    queryParams.append('demographic', params.demographic);
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Generate cache key based on params
 */
const getCacheKey = (params?: LeaderboardParams): string => {
  const base = CACHE_KEYS.LEADERBOARD;
  if (!params) return base;

  const parts = [
    params.discipline || 'all',
    params.timePeriod || 'month',
    params.demographic || 'all',
  ];

  return `${base}:${parts.join(':')}`;
};

/**
 * Fetch leaderboard with optional filters
 * Uses cache fallback for better UX
 */
export const getLeaderboard = async (
  params?: LeaderboardParams
): Promise<{ data: LeaderboardResponse; fromCache: boolean }> => {
  const cacheKey = getCacheKey(params);
  const queryString = buildQueryString(params);
  const endpoint = `${ENDPOINTS.LEADERBOARD.LIST}${queryString}`;

  const result = await fetchWithCacheFallback<LeaderboardResponse>(
    cacheKey,
    async () => {
      const response = await api.get<ApiLeaderboardResponse>(endpoint);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to fetch leaderboard');
      }
      return transformResponse(response.data);
    },
    { maxAge: CACHE_DURATIONS.SHORT }
  );

  return {
    data: result.data,
    fromCache: result.fromCache,
  };
};

/**
 * Default/empty leaderboard for initial state
 */
export const DEFAULT_LEADERBOARD: LeaderboardResponse = {
  leaderboard: {
    userRank: {
      rank: 0,
      totalUsers: 0,
      points: 0,
      classesAttended: 0,
      streakWeeks: 0,
    },
    timePeriod: 'month',
    entries: [],
  },
  filters: {
    disciplines: [],
    timePeriods: [],
    demographics: [],
  },
};
