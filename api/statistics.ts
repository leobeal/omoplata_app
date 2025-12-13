import { api } from './client';
import { ENDPOINTS } from './config';

import { CACHE_KEYS, CACHE_DURATIONS, fetchWithCacheFallback } from '@/utils/local-cache';

// ============================================
// Chart Types
// ============================================

export type ChartType = 'line' | 'bar' | 'pie' | 'stats' | 'heatmap' | 'comparison' | 'progress';

export type GraphType =
  | 'weekly_attendance'
  | 'monthly_attendance'
  | 'discipline_breakdown'
  | 'class_type_breakdown'
  | 'training_streak'
  | 'attendance_heatmap'
  | 'year_overview'
  | 'progress_to_next_belt';

// ============================================
// Graph Objects by Type
// ============================================

export interface WeeklyAttendanceGraph {
  type: 'weekly_attendance';
  chart_type: 'line';
  labels: string[]; // 6 weeks
  data: number[];
}

export interface MonthlyAttendanceGraph {
  type: 'monthly_attendance';
  chart_type: 'bar';
  labels: string[]; // 12 months
  data: number[];
}

export interface DisciplineBreakdownGraph {
  type: 'discipline_breakdown';
  chart_type: 'pie';
  labels: string[];
  data: number[];
  colors: string[];
}

export interface ClassTypeBreakdownGraph {
  type: 'class_type_breakdown';
  chart_type: 'pie';
  labels: string[];
  data: number[];
}

export interface TrainingStreakGraph {
  type: 'training_streak';
  chart_type: 'stats';
  current_streak: number;
  longest_streak: number;
  current_week_trained: number;
}

export interface AttendanceHeatmapGraph {
  type: 'attendance_heatmap';
  chart_type: 'heatmap';
  data: Record<string, number>; // date string -> attendance count
  start_date: string;
  end_date: string;
}

export interface YearOverviewGraph {
  type: 'year_overview';
  chart_type: 'comparison';
  current_year: number;
  previous_year: number;
  current_year_label: string;
  previous_year_label: string;
  difference: number;
  percentage_change: number;
}

export interface BeltRequirement {
  name: string;
  current: number;
  required: number;
  unit: string;
}

export interface DisciplineProgress {
  discipline_name: string;
  current_belt: string;
  next_belt: string;
  current_stripes: number;
  is_max_rank: boolean;
  requirements: BeltRequirement[];
}

export interface ProgressToNextBeltGraph {
  type: 'progress_to_next_belt';
  chart_type: 'progress';
  disciplines: DisciplineProgress[];
}

// Union type for all graph types
export type AnalyticsGraph =
  | WeeklyAttendanceGraph
  | MonthlyAttendanceGraph
  | DisciplineBreakdownGraph
  | ClassTypeBreakdownGraph
  | TrainingStreakGraph
  | AttendanceHeatmapGraph
  | YearOverviewGraph
  | ProgressToNextBeltGraph;

// ============================================
// Available Types Configuration
// ============================================

export interface AvailableGraphType {
  value: GraphType;
  label: string;
  description: string;
  chart_type: ChartType;
}

// ============================================
// API Response Types
// ============================================

export interface AnalyticsData {
  graphs: AnalyticsGraph[];
  enabled_types: GraphType[];
  available_types: AvailableGraphType[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get a specific graph from the analytics data by type
 */
export function getGraphByType<T extends AnalyticsGraph>(
  graphs: AnalyticsGraph[],
  type: T['type']
): T | undefined {
  return graphs.find((g) => g.type === type) as T | undefined;
}

/**
 * Filter graphs to only enabled types
 */
export function getEnabledGraphs(data: AnalyticsData): AnalyticsGraph[] {
  return data.graphs.filter((graph) => data.enabled_types.includes(graph.type));
}

/**
 * Check if a graph type is enabled
 */
export function isGraphEnabled(data: AnalyticsData, type: GraphType): boolean {
  return data.enabled_types.includes(type);
}

// ============================================
// API Functions
// ============================================

/**
 * Get analytics data with cache fallback
 */
export async function getAnalytics(): Promise<{
  data: AnalyticsData;
  fromCache: boolean;
} | null> {
  const result = await fetchWithCacheFallback<AnalyticsResponse>(
    CACHE_KEYS.STATISTICS,
    async () => {
      const response = await api.get<AnalyticsResponse>(ENDPOINTS.STATISTICS.DASHBOARD);
      return response.data;
    },
    { maxAge: CACHE_DURATIONS.SHORT }
  );

  // Handle null response (e.g., after 401 logout)
  if (!result.data) {
    return null;
  }

  return {
    data: result.data.data,
    fromCache: result.fromCache,
  };
}

// ============================================
// Default/Empty Data
// ============================================

export const DEFAULT_ANALYTICS_DATA: AnalyticsData = {
  graphs: [],
  enabled_types: [],
  available_types: [],
};
