import classesData from '@/data/classes.json';

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
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Filter classes that are today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (classesData as Class[])
    .filter((cls) => {
      const classDate = new Date(cls.date);
      classDate.setHours(0, 0, 0, 0);
      return classDate >= today;
    })
    .sort((a, b) => {
      // Sort by date, then by start time
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
};

/**
 * Fetch classes with pagination and filtering
 */
export const getClassesPaginated = async (
  limit: number = 10,
  offset: number = 0,
  filters?: ClassFilters
): Promise<{ classes: Class[]; hasMore: boolean; total: number }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter classes that are today or in the future
  let filteredClasses = (classesData as Class[]).filter((cls) => {
    const classDate = new Date(cls.date);
    classDate.setHours(0, 0, 0, 0);
    return classDate >= today;
  });

  // Apply filters
  if (filters) {
    if (filters.category) {
      filteredClasses = filteredClasses.filter((cls) => cls.category === filters.category);
    }
    if (filters.level) {
      filteredClasses = filteredClasses.filter((cls) => cls.level === filters.level);
    }
    if (filters.instructor) {
      filteredClasses = filteredClasses.filter((cls) => cls.instructor === filters.instructor);
    }
    if (filters.location) {
      filteredClasses = filteredClasses.filter((cls) => cls.location === filters.location);
    }
  }

  // Sort by date and time
  filteredClasses.sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const total = filteredClasses.length;
  const classes = filteredClasses.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return { classes, hasMore, total };
};

/**
 * Get unique categories from classes
 */
export const getClassCategories = async (): Promise<string[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const categories = [...new Set((classesData as Class[]).map((cls) => cls.category).filter(Boolean))];
  return categories as string[];
};

/**
 * Get unique levels from classes
 */
export const getClassLevels = async (): Promise<string[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const levels = [...new Set((classesData as Class[]).map((cls) => cls.level))];
  return levels;
};

/**
 * Get unique instructors from classes
 */
export const getClassInstructors = async (): Promise<string[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const instructors = [...new Set((classesData as Class[]).map((cls) => cls.instructor))];
  return instructors;
};

/**
 * Get unique locations from classes
 */
export const getClassLocations = async (): Promise<string[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const locations = [...new Set((classesData as Class[]).map((cls) => cls.location))];
  return locations;
};

/**
 * Confirm attendance for a class
 */
export const confirmAttendance = async (classId: string): Promise<Class> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const classItem = (classesData as Class[]).find((cls) => cls.id === classId);
  if (!classItem) {
    throw new Error('Class not found');
  }

  // In a real app, this would update the backend
  return { ...classItem, status: 'confirmed' };
};

/**
 * Deny attendance for a class
 */
export const denyAttendance = async (classId: string): Promise<Class> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const classItem = (classesData as Class[]).find((cls) => cls.id === classId);
  if (!classItem) {
    throw new Error('Class not found');
  }

  // In a real app, this would update the backend
  return { ...classItem, status: 'denied' };
};

/**
 * Get a single class by ID
 */
export const getClassById = async (id: string): Promise<Class | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  const classItem = (classesData as Class[]).find((cls) => cls.id === id);
  return classItem ? (classItem as Class) : null;
};
