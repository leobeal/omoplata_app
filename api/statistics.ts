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
// App Types (camelCase) - Graph Objects by Type
// ============================================

export interface WeeklyAttendanceGraph {
  type: 'weekly_attendance';
  chartType: 'line';
  labels: string[]; // 6 weeks
  data: number[];
}

export interface MonthlyAttendanceGraph {
  type: 'monthly_attendance';
  chartType: 'bar';
  labels: string[]; // 12 months
  data: number[];
}

export interface DisciplineBreakdownGraph {
  type: 'discipline_breakdown';
  chartType: 'pie';
  labels: string[];
  data: number[];
  colors: string[];
}

export interface ClassTypeBreakdownGraph {
  type: 'class_type_breakdown';
  chartType: 'pie';
  labels: string[];
  data: number[];
}

export interface TrainingStreakGraph {
  type: 'training_streak';
  chartType: 'stats';
  currentStreak: number;
  longestStreak: number;
  currentWeekTrained: number;
}

export interface AttendanceHeatmapGraph {
  type: 'attendance_heatmap';
  chartType: 'heatmap';
  data: Record<string, number>; // date string -> attendance count
  startDate: string;
  endDate: string;
}

export interface YearOverviewGraph {
  type: 'year_overview';
  chartType: 'comparison';
  currentYear: number;
  previousYear: number;
  currentYearLabel: string;
  previousYearLabel: string;
  difference: number;
  percentageChange: number;
}

export interface BeltRequirement {
  name: string;
  current: number;
  required: number;
  unit: string;
}

export interface DisciplineProgress {
  disciplineName: string;
  currentBelt: string;
  nextBelt: string;
  currentStripes: number;
  isMaxRank: boolean;
  requirements: BeltRequirement[];
}

export interface ProgressToNextBeltGraph {
  type: 'progress_to_next_belt';
  chartType: 'progress';
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
  chartType: ChartType;
}

// ============================================
// App Response Types
// ============================================

export interface AnalyticsData {
  graphs: AnalyticsGraph[];
  enabledTypes: GraphType[];
  availableTypes: AvailableGraphType[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

// ============================================
// API Types (snake_case from backend)
// ============================================

interface ApiWeeklyAttendanceGraph {
  type: 'weekly_attendance';
  chart_type: 'line';
  labels: string[];
  data: number[];
}

interface ApiMonthlyAttendanceGraph {
  type: 'monthly_attendance';
  chart_type: 'bar';
  labels: string[];
  data: number[];
}

interface ApiDisciplineBreakdownGraph {
  type: 'discipline_breakdown';
  chart_type: 'pie';
  labels: string[];
  data: number[];
  colors: string[];
}

interface ApiClassTypeBreakdownGraph {
  type: 'class_type_breakdown';
  chart_type: 'pie';
  labels: string[];
  data: number[];
}

interface ApiTrainingStreakGraph {
  type: 'training_streak';
  chart_type: 'stats';
  current_streak: number;
  longest_streak: number;
  current_week_trained: number;
}

interface ApiAttendanceHeatmapGraph {
  type: 'attendance_heatmap';
  chart_type: 'heatmap';
  data: Record<string, number>;
  start_date: string;
  end_date: string;
}

interface ApiYearOverviewGraph {
  type: 'year_overview';
  chart_type: 'comparison';
  current_year: number;
  previous_year: number;
  current_year_label: string;
  previous_year_label: string;
  difference: number;
  percentage_change: number;
}

interface ApiBeltRequirement {
  name: string;
  current: number;
  required: number;
  unit: string;
}

interface ApiDisciplineProgress {
  discipline_name: string;
  current_belt: string;
  next_belt: string;
  current_stripes: number;
  is_max_rank: boolean;
  requirements: ApiBeltRequirement[];
}

interface ApiProgressToNextBeltGraph {
  type: 'progress_to_next_belt';
  chart_type: 'progress';
  disciplines: ApiDisciplineProgress[];
}

type ApiAnalyticsGraph =
  | ApiWeeklyAttendanceGraph
  | ApiMonthlyAttendanceGraph
  | ApiDisciplineBreakdownGraph
  | ApiClassTypeBreakdownGraph
  | ApiTrainingStreakGraph
  | ApiAttendanceHeatmapGraph
  | ApiYearOverviewGraph
  | ApiProgressToNextBeltGraph;

interface ApiAvailableGraphType {
  value: GraphType;
  label: string;
  description: string;
  chart_type: ChartType;
}

interface ApiAnalyticsData {
  graphs: ApiAnalyticsGraph[];
  enabled_types: GraphType[];
  available_types: ApiAvailableGraphType[];
}

interface ApiAnalyticsResponse {
  success: boolean;
  data: ApiAnalyticsData;
}

// ============================================
// Transform Functions
// ============================================

function transformDisciplineProgress(progress: ApiDisciplineProgress): DisciplineProgress {
  return {
    disciplineName: progress.discipline_name,
    currentBelt: progress.current_belt,
    nextBelt: progress.next_belt,
    currentStripes: progress.current_stripes,
    isMaxRank: progress.is_max_rank,
    requirements: progress.requirements,
  };
}

function transformGraph(graph: ApiAnalyticsGraph): AnalyticsGraph {
  switch (graph.type) {
    case 'weekly_attendance':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        labels: graph.labels,
        data: graph.data,
      };
    case 'monthly_attendance':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        labels: graph.labels,
        data: graph.data,
      };
    case 'discipline_breakdown':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        labels: graph.labels,
        data: graph.data,
        colors: graph.colors,
      };
    case 'class_type_breakdown':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        labels: graph.labels,
        data: graph.data,
      };
    case 'training_streak':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        currentStreak: graph.current_streak,
        longestStreak: graph.longest_streak,
        currentWeekTrained: graph.current_week_trained,
      };
    case 'attendance_heatmap':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        data: graph.data,
        startDate: graph.start_date,
        endDate: graph.end_date,
      };
    case 'year_overview':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        currentYear: graph.current_year,
        previousYear: graph.previous_year,
        currentYearLabel: graph.current_year_label,
        previousYearLabel: graph.previous_year_label,
        difference: graph.difference,
        percentageChange: graph.percentage_change,
      };
    case 'progress_to_next_belt':
      return {
        type: graph.type,
        chartType: graph.chart_type,
        disciplines: graph.disciplines.map(transformDisciplineProgress),
      };
    default:
      // Exhaustive check - should never reach here
      return graph as never;
  }
}

function transformAvailableType(type: ApiAvailableGraphType): AvailableGraphType {
  return {
    value: type.value,
    label: type.label,
    description: type.description,
    chartType: type.chart_type,
  };
}

function transformAnalyticsData(data: ApiAnalyticsData): AnalyticsData {
  return {
    graphs: data.graphs.map(transformGraph),
    enabledTypes: data.enabled_types,
    availableTypes: data.available_types.map(transformAvailableType),
  };
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
  return data.graphs.filter((graph) => data.enabledTypes.includes(graph.type));
}

/**
 * Check if a graph type is enabled
 */
export function isGraphEnabled(data: AnalyticsData, type: GraphType): boolean {
  return data.enabledTypes.includes(type);
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
  const result = await fetchWithCacheFallback<ApiAnalyticsResponse>(
    CACHE_KEYS.STATISTICS,
    async () => {
      const response = await api.get<ApiAnalyticsResponse>(ENDPOINTS.STATISTICS.DASHBOARD);
      if (!response.data) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.data;
    },
    { maxAge: CACHE_DURATIONS.SHORT }
  );

  // Handle null response (e.g., after 401 logout)
  if (!result.data) {
    return null;
  }

  return {
    data: transformAnalyticsData(result.data.data),
    fromCache: result.fromCache,
  };
}

// ============================================
// Default/Empty Data
// ============================================

export const DEFAULT_ANALYTICS_DATA: AnalyticsData = {
  graphs: [],
  enabledTypes: [],
  availableTypes: [],
};
