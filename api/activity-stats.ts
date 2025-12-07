import { api } from './client';
import { ENDPOINTS } from './config';

/**
 * Expected API Response Structure:
 *
 * GET /users/activity-stats (or similar endpoint)
 *
 * {
 *   "success": true,
 *   "data": {
 *     "classes": {
 *       "this_month": 12,
 *       "last_7_days": [2, 3, 1, 4, 2, 3, 4]  // daily counts, oldest to newest
 *     },
 *     "checkins": {
 *       "this_month": 18,
 *       "this_week": [3, 2, 4, 3, 5, 4, 6]    // daily counts, oldest to newest
 *     },
 *     "goal": {
 *       "target": 20,                          // monthly goal
 *       "completed": 15,                       // classes completed
 *       "percentage": 75                       // completion percentage
 *     },
 *     "weekly_activity": {
 *       "weeks": [85, 70, 95],                 // percentage for last 3 weeks
 *       "current_percentage": 95
 *     }
 *   }
 * }
 */

// API Response Types (snake_case as returned by backend)
interface ApiClassesStats {
  this_month: number;
  last_7_days: number[];
}

interface ApiCheckinsStats {
  this_month: number;
  this_week: number[];
}

interface ApiGoalStats {
  target: number;
  completed: number;
  percentage: number;
}

interface ApiWeeklyActivity {
  weeks: number[];
  current_percentage: number;
}

interface ApiActivityStatsResponse {
  success: boolean;
  data: {
    classes: ApiClassesStats;
    checkins: ApiCheckinsStats;
    goal: ApiGoalStats;
    weekly_activity: ApiWeeklyActivity;
  };
}

// Internal App Types (camelCase)
export interface ClassesStats {
  thisMonth: number;
  last7Days: number[];
}

export interface CheckinsStats {
  thisMonth: number;
  thisWeek: number[];
}

export interface GoalStats {
  target: number;
  completed: number;
  percentage: number;
}

export interface WeeklyActivity {
  weeks: number[];
  currentPercentage: number;
}

export interface ActivityStats {
  classes: ClassesStats;
  checkins: CheckinsStats;
  goal: GoalStats;
  weeklyActivity: WeeklyActivity;
}

/**
 * Transform API response to internal format
 */
const transformApiResponse = (apiData: ApiActivityStatsResponse['data']): ActivityStats => ({
  classes: {
    thisMonth: apiData.classes.this_month,
    last7Days: apiData.classes.last_7_days,
  },
  checkins: {
    thisMonth: apiData.checkins.this_month,
    thisWeek: apiData.checkins.this_week,
  },
  goal: {
    target: apiData.goal.target,
    completed: apiData.goal.completed,
    percentage: apiData.goal.percentage,
  },
  weeklyActivity: {
    weeks: apiData.weekly_activity.weeks,
    currentPercentage: apiData.weekly_activity.current_percentage,
  },
});

/**
 * Fetch user activity stats
 */
export const getActivityStats = async (): Promise<ActivityStats> => {
  const response = await api.get<ApiActivityStatsResponse>(ENDPOINTS.USERS.ACTIVITY_STATS);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch activity stats');
  }

  return transformApiResponse(response.data.data);
};
