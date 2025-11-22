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
