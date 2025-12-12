import { BeltSystem } from './graduations';

import data from '@/data/leaderboard.json';

// API response types (snake_case - matches backend JSON)
interface ApiUserRank {
  rank: number;
  total_users: number;
  points: number;
  classes_attended: number;
  streak_weeks: number;
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
  belt_system: BeltSystem | null;
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
  sort_by: ApiFilterOption[];
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
  beltSystem: BeltSystem | null;
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
  sortBy: FilterOption[];
}

export interface LeaderboardResponse {
  leaderboard: Leaderboard;
  filters: LeaderboardFilters;
}

export interface LeaderboardParams {
  discipline?: string;
  timePeriod?: string;
  demographic?: string;
  sortBy?: string;
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
  beltSystem: api.belt_system,
  trend: api.trend,
  rankChange: api.rank_change,
  isOptedIn: api.is_opted_in !== false, // Default to true if not specified
});

const transformFilters = (api: ApiFilters): LeaderboardFilters => ({
  disciplines: api.disciplines,
  timePeriods: api.time_periods,
  demographics: api.demographics,
  sortBy: api.sort_by,
});

const transformLeaderboard = (api: ApiLeaderboard): Leaderboard => ({
  userRank: transformUserRank(api.user_rank),
  timePeriod: api.time_period,
  entries: api.entries.map(transformEntry),
});

// Cast data to API types
const apiData = data as ApiLeaderboardResponse;

/**
 * Fetch leaderboard with optional filters
 */
export const getLeaderboard = async (params?: LeaderboardParams): Promise<LeaderboardResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let entries = apiData.leaderboard.entries;

  // Apply discipline filter (mock)
  if (params?.discipline && params.discipline !== 'all') {
    entries = entries.filter((e) =>
      e.top_discipline.toLowerCase().includes(params.discipline!.toLowerCase())
    );
    // Re-rank after filter
    entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }

  // Apply sort (mock)
  if (params?.sortBy) {
    switch (params.sortBy) {
      case 'classes':
        entries = [...entries].sort((a, b) => b.classes_attended - a.classes_attended);
        break;
      case 'streak':
        entries = [...entries].sort((a, b) => b.streak_weeks - a.streak_weeks);
        break;
      default:
        entries = [...entries].sort((a, b) => b.points - a.points);
    }
    // Re-rank after sort
    entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }

  // Apply limit/offset
  if (params?.limit) {
    const offset = params.offset || 0;
    entries = entries.slice(offset, offset + params.limit);
  }

  return {
    leaderboard: transformLeaderboard({
      ...apiData.leaderboard,
      entries,
      time_period: params?.timePeriod || apiData.leaderboard.time_period,
    }),
    filters: transformFilters(apiData.filters),
  };
};

/**
 * Fetch only the filter options
 */
export const getLeaderboardFilters = async (): Promise<LeaderboardFilters> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return transformFilters(apiData.filters);
};

/**
 * Fetch current user's rank
 */
export const getUserRank = async (params?: LeaderboardParams): Promise<UserRank> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return transformUserRank(apiData.leaderboard.user_rank);
};
