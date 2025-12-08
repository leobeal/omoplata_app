import { api } from './client';
import { ENDPOINTS } from './config';

import {
  getFromCacheWithStale,
  CACHE_KEYS,
  CACHE_DURATIONS,
  fetchWithCacheFallback,
} from '@/utils/local-cache';

export type AttendanceStatus = 'pending' | 'confirmed' | 'denied';

// API Response Types (snake_case as returned by backend)
interface ApiClassInfo {
  id: number;
  name: string;
  description: string | null;
  level: string | null;
  discipline: string;
  max_participants: number | null;
  requires_assignment: boolean;
}

interface ApiVenue {
  id: number;
  name: string;
}

interface ApiCapacity {
  max: number | null;
  is_full: boolean;
  available_spots: number | null;
}

interface ApiUserStatus {
  has_intention: boolean;
  intention: {
    status: 'yes' | 'no';
    notes: string | null;
  } | null;
  can_register: boolean;
}

interface ApiClassSession {
  id: number;
  class: ApiClassInfo;
  starts_at: string;
  ends_at: string;
  trainer: string | null;
  venue: ApiVenue;
  capacity: ApiCapacity;
  user_status: ApiUserStatus;
}

interface ApiChildWithClasses {
  id: number;
  prefixed_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  classes: ApiClassSession[];
}

interface ApiClassesResponse {
  success: boolean;
  data: ApiClassSession[];
  children: ApiChildWithClasses[];
  meta: {
    total: number;
    limit: string;
    has_assignments: boolean;
  };
}

// Internal App Types (camelCase, simplified)
export interface ClassCapacity {
  max: number | null;
  is_full: boolean;
  available_spots: number | null;
}

export interface Class {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  capacity: ClassCapacity;
  enrolled: number;
  status: AttendanceStatus;
  description: string;
  level: string;
  category?: string;
}

export interface ClassFilters {
  onlyMe?: boolean;
  userDemographicId?: number;
  disciplineId?: number;
  clazzId?: number;
  limit?: number;
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
}

// Child with their classes (for responsible users)
export interface ChildWithClasses {
  id: string;
  prefixedId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  classes: Class[];
}

// Response type including children's classes
export interface ClassesWithChildren {
  classes: Class[];
  children: ChildWithClasses[];
  fromCache?: boolean;
}

// Response type with cache info
export interface ClassesResponse {
  classes: Class[];
  fromCache: boolean;
}

/**
 * Transform API response to internal Class format
 */
/**
 * Extract time (HH:MM) from date string
 * Handles both "2025-12-08 10:00:00" and "2025-12-08T10:00:00.000Z" formats
 */
const extractTime = (dateString: string): string => {
  // Split on space or T to get the time portion
  const timePart = dateString.split(/[T ]/)[1];
  // Return first 5 chars (HH:MM)
  return timePart ? timePart.substring(0, 5) : '00:00';
};

const transformApiClass = (apiClass: ApiClassSession): Class => {
  const startsAt = new Date(apiClass.starts_at);
  const endsAt = new Date(apiClass.ends_at);
  const duration = Math.round((endsAt.getTime() - startsAt.getTime()) / (1000 * 60)); // minutes

  // Determine status based on user_status
  let status: AttendanceStatus = 'pending';
  if (apiClass.user_status.has_intention && apiClass.user_status.intention) {
    status = apiClass.user_status.intention.status === 'yes' ? 'confirmed' : 'denied';
  }

  return {
    id: apiClass.id.toString(),
    title: apiClass.class.name,
    instructor: apiClass.trainer || 'TBA',
    instructorAvatar: '', // Not provided by API
    date: apiClass.starts_at,
    startTime: extractTime(apiClass.starts_at),
    endTime: extractTime(apiClass.ends_at),
    duration,
    location: apiClass.venue.name,
    capacity: apiClass.capacity,
    enrolled:
      apiClass.capacity.max && apiClass.capacity.available_spots !== null
        ? apiClass.capacity.max - apiClass.capacity.available_spots
        : 0,
    status,
    description: apiClass.class.description || '',
    level: apiClass.class.level || '',
    category: apiClass.class.discipline,
  };
};

/**
 * Build query string from filters
 */
const buildQueryString = (filters?: ClassFilters): string => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.onlyMe) params.append('only_me', 'true');
  if (filters.userDemographicId)
    params.append('user_demographic_id', String(filters.userDemographicId));
  if (filters.disciplineId) params.append('discipline_id', String(filters.disciplineId));
  if (filters.clazzId) params.append('clazz_id', String(filters.clazzId));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.fromDate) params.append('from_date', filters.fromDate);
  if (filters.toDate) params.append('to_date', filters.toDate);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Fetch classes with optional filters
 * Uses cache fallback if API takes longer than 4 seconds
 * Returns classes and whether data came from cache
 */
export const getClasses = async (filters?: ClassFilters): Promise<ClassesResponse> => {
  const queryString = buildQueryString(filters);
  const cacheKey = `${CACHE_KEYS.CLASSES}:${queryString || 'default'}`;

  const fetchFromApi = async (): Promise<Class[]> => {
    const response = await api.get<ApiClassesResponse>(`${ENDPOINTS.CLASSES.LIST}${queryString}`);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch classes');
    }

    return response.data.data.map(transformApiClass);
  };

  try {
    const result = await fetchWithCacheFallback(cacheKey, fetchFromApi);
    return { classes: result.data, fromCache: result.fromCache };
  } catch (error) {
    // Try to get cached data as fallback (allow stale for offline)
    const { data: cachedClasses } = await getFromCacheWithStale<Class[]>(
      cacheKey,
      CACHE_DURATIONS.MEDIUM
    );

    if (cachedClasses) {
      console.log('[Classes] Using cached data as offline fallback');
      return { classes: cachedClasses, fromCache: true };
    }

    // No cache available, re-throw original error
    throw error;
  }
};

/**
 * Fetch upcoming classes (convenience wrapper)
 */
export const getUpcomingClasses = async (limit?: number): Promise<Class[]> => {
  const result = await getClasses(limit ? { limit } : undefined);
  return result.classes;
};

/**
 * Fetch only user's classes
 */
export const getMyClasses = async (limit?: number): Promise<Class[]> => {
  const result = await getClasses({ onlyMe: true, limit });
  return result.classes;
};

/**
 * Transform API child response to internal format
 */
const transformApiChild = (apiChild: ApiChildWithClasses): ChildWithClasses => ({
  id: String(apiChild.id),
  prefixedId: apiChild.prefixed_id,
  firstName: apiChild.first_name,
  lastName: apiChild.last_name,
  fullName: apiChild.full_name,
  classes: apiChild.classes.map(transformApiClass),
});

/**
 * Fetch user's classes and children's classes
 * Returns both the user's own classes and their children's classes (for responsible users)
 * Uses cache fallback if API takes longer than 4 seconds
 */
export const getMyClassesWithChildren = async (limit?: number): Promise<ClassesWithChildren> => {
  const queryString = buildQueryString({ onlyMe: true, limit });
  const cacheKey = `${CACHE_KEYS.CLASSES}:with_children:${queryString || 'default'}`;

  const fetchFromApi = async (): Promise<ClassesWithChildren> => {
    const response = await api.get<ApiClassesResponse>(`${ENDPOINTS.CLASSES.LIST}${queryString}`);

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch classes');
    }

    return {
      classes: response.data.data.map(transformApiClass),
      children: (response.data.children || []).map(transformApiChild),
    };
  };

  try {
    const result = await fetchWithCacheFallback(cacheKey, fetchFromApi);
    return { ...result.data, fromCache: result.fromCache };
  } catch (error) {
    // Try to get cached data as fallback (allow stale for offline)
    const { data: cachedData } = await getFromCacheWithStale<ClassesWithChildren>(
      cacheKey,
      CACHE_DURATIONS.MEDIUM
    );

    if (cachedData) {
      console.log('[Classes] Using cached data as offline fallback');
      return { ...cachedData, fromCache: true };
    }

    // No cache available, re-throw original error
    throw error;
  }
};

/**
 * Fetch classes with pagination
 */
export const getClassesPaginated = async (
  filters?: ClassFilters
): Promise<{ classes: Class[]; total: number }> => {
  const queryString = buildQueryString(filters);
  const response = await api.get<ApiClassesResponse>(`${ENDPOINTS.CLASSES.LIST}${queryString}`);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch classes');
  }

  return {
    classes: response.data.data.map(transformApiClass),
    total: response.data.meta.total,
  };
};

/**
 * Set attendance intention for a class
 * @param occurrenceId - The class occurrence ID
 * @param decision - 'confirm' or 'decline'
 * @param options - Optional parameters (notes, childId)
 */
export const setAttendanceIntention = async (
  occurrenceId: string,
  decision: 'confirm' | 'decline',
  options?: { notes?: string; childId?: string }
): Promise<void> => {
  const payload: Record<string, unknown> = {
    occurrence_id: parseInt(occurrenceId, 10),
    decision,
    notes: options?.notes || '',
  };

  if (options?.childId) {
    payload.child_id = parseInt(options.childId, 10);
  }

  const response = await api.post(ENDPOINTS.ATTENDANCE.CREATE_INTENTION, payload, { timeout: 4000 });

  if (response.error) {
    throw new Error(response.error || 'Failed to set attendance intention');
  }
};

/**
 * Confirm attendance for a class
 */
export const confirmAttendance = async (
  classId: string,
  options?: { notes?: string; childId?: string }
): Promise<void> => {
  await setAttendanceIntention(classId, 'confirm', options);
};

/**
 * Deny attendance for a class
 */
export const denyAttendance = async (
  classId: string,
  options?: { notes?: string; childId?: string }
): Promise<void> => {
  await setAttendanceIntention(classId, 'decline', options);
};

/**
 * Get a single class by ID
 */
export const getClassById = async (id: string): Promise<Class | null> => {
  const response = await api.get<{ class: Class }>(ENDPOINTS.CLASSES.DETAILS(id));

  if (response.error || !response.data) {
    return null;
  }

  return response.data.class;
};
