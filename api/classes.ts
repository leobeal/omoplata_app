import { api } from './client';
import { ENDPOINTS } from './config';

export type AttendanceStatus = 'pending' | 'confirmed' | 'denied';

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
  capacity: number;
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
 * Fetch upcoming classes
 */
export const getUpcomingClasses = async (limit?: number): Promise<Class[]> => {
  const params = limit ? `?limit=${limit}` : '';
  const response = await api.get<{ success: boolean; data: Class[] }>(`${ENDPOINTS.CLASSES.NEXT}${params}`);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch classes');
  }

  return response.data.data || [];
};

/**
 * Fetch classes with pagination
 * Note: The API endpoint /classes/next doesn't support all filter options.
 * Filtering should be done client-side if needed.
 */
export const getClassesPaginated = async (
  limit: number = 10
): Promise<{ classes: Class[]; total: number }> => {
  const response = await api.get<{ success: boolean; data: Class[]; meta: { total: number } }>(
    `${ENDPOINTS.CLASSES.NEXT}?limit=${limit}`
  );

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch classes');
  }

  return {
    classes: response.data.data || [],
    total: response.data.meta?.total || 0,
  };
};

/**
 * Confirm attendance for a class
 */
export const confirmAttendance = async (classId: string): Promise<Class> => {
  const response = await api.post<{ class: Class }>(ENDPOINTS.CLASSES.BOOK(classId));

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to confirm attendance');
  }

  return response.data.class;
};

/**
 * Deny attendance for a class
 */
export const denyAttendance = async (classId: string): Promise<Class> => {
  const response = await api.post<{ class: Class }>(ENDPOINTS.CLASSES.CANCEL_BOOKING(classId));

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to deny attendance');
  }

  return response.data.class;
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
