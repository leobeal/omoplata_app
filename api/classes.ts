import { api } from './client';
import { ENDPOINTS } from './config';

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
  intention: string | null;
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

interface ApiClassesResponse {
  success: boolean;
  data: ApiClassSession[];
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
  category?: string;
  level?: string;
  instructor?: string;
  location?: string;
}

/**
 * Transform API response to internal Class format
 */
const transformApiClass = (apiClass: ApiClassSession): Class => {
  const startsAt = new Date(apiClass.starts_at);
  const endsAt = new Date(apiClass.ends_at);
  const duration = Math.round((endsAt.getTime() - startsAt.getTime()) / (1000 * 60)); // minutes

  // Determine status based on user_status
  let status: AttendanceStatus = 'pending';
  if (apiClass.user_status.has_intention) {
    status = apiClass.user_status.intention === 'confirmed' ? 'confirmed' : 'denied';
  }

  return {
    id: apiClass.id.toString(),
    title: apiClass.class.name,
    instructor: apiClass.trainer || 'TBA',
    instructorAvatar: '', // Not provided by API
    date: apiClass.starts_at,
    startTime: startsAt.toISOString().split('T')[1].substring(0, 5), // HH:MM format
    endTime: endsAt.toISOString().split('T')[1].substring(0, 5), // HH:MM format
    duration,
    location: apiClass.venue.name,
    capacity: apiClass.capacity,
    enrolled: apiClass.capacity.max && apiClass.capacity.available_spots !== null
      ? apiClass.capacity.max - apiClass.capacity.available_spots
      : 0,
    status,
    description: apiClass.class.description || '',
    level: apiClass.class.level || '',
    category: apiClass.class.discipline,
  };
};

/**
 * Fetch upcoming classes
 */
export const getUpcomingClasses = async (limit?: number): Promise<Class[]> => {
  const params = limit ? `?limit=${limit}` : '';
  const response = await api.get<ApiClassesResponse>(`${ENDPOINTS.CLASSES.NEXT}${params}`);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch classes');
  }

  return response.data.data.map(transformApiClass);
};

/**
 * Fetch classes with pagination
 */
export const getClassesPaginated = async (
  limit: number = 10
): Promise<{ classes: Class[]; total: number }> => {
  const response = await api.get<ApiClassesResponse>(
    `${ENDPOINTS.CLASSES.NEXT}?limit=${limit}`
  );

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
 */
export const setAttendanceIntention = async (
  occurrenceId: string,
  decision: 'confirm' | 'decline',
  notes?: string
): Promise<void> => {
  const response = await api.post(ENDPOINTS.ATTENDANCE.CREATE_INTENTION, {
    occurrence_id: parseInt(occurrenceId),
    decision,
    notes: notes || '',
  });

  if (response.error) {
    throw new Error(response.error || 'Failed to set attendance intention');
  }
};

/**
 * Confirm attendance for a class
 */
export const confirmAttendance = async (classId: string, notes?: string): Promise<void> => {
  await setAttendanceIntention(classId, 'confirm', notes);
};

/**
 * Deny attendance for a class
 */
export const denyAttendance = async (classId: string, notes?: string): Promise<void> => {
  await setAttendanceIntention(classId, 'decline', notes);
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
