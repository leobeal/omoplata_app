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
export const getUpcomingClasses = async (): Promise<Class[]> => {
  const response = await api.get<{ classes: Class[] }>(ENDPOINTS.CLASSES.LIST);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch classes');
  }

  return response.data.classes || [];
};

/**
 * Fetch classes with pagination and filtering
 */
export const getClassesPaginated = async (
  limit: number = 10,
  offset: number = 0,
  filters?: ClassFilters
): Promise<{ classes: Class[]; hasMore: boolean; total: number }> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.level && { level: filters.level }),
    ...(filters?.instructor && { instructor: filters.instructor }),
    ...(filters?.location && { location: filters.location }),
  });

  const endpoint = `${ENDPOINTS.CLASSES.LIST}?${params.toString()}`;
  const response = await api.get<{ classes: Class[]; total: number; hasMore: boolean }>(endpoint);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch classes');
  }

  return {
    classes: response.data.classes || [],
    total: response.data.total || 0,
    hasMore: response.data.hasMore || false,
  };
};

/**
 * Get unique categories from classes
 */
export const getClassCategories = async (): Promise<string[]> => {
  const response = await api.get<{ categories: string[] }>(`${ENDPOINTS.CLASSES.LIST}/categories`);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch categories');
  }

  return response.data.categories || [];
};

/**
 * Get unique levels from classes
 */
export const getClassLevels = async (): Promise<string[]> => {
  const response = await api.get<{ levels: string[] }>(`${ENDPOINTS.CLASSES.LIST}/levels`);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch levels');
  }

  return response.data.levels || [];
};

/**
 * Get unique instructors from classes
 */
export const getClassInstructors = async (): Promise<string[]> => {
  const response = await api.get<{ instructors: string[] }>(`${ENDPOINTS.CLASSES.LIST}/instructors`);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch instructors');
  }

  return response.data.instructors || [];
};

/**
 * Get unique locations from classes
 */
export const getClassLocations = async (): Promise<string[]> => {
  const response = await api.get<{ locations: string[] }>(`${ENDPOINTS.CLASSES.LIST}/locations`);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch locations');
  }

  return response.data.locations || [];
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
