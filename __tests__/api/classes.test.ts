import { api } from '../../api/client';
import {
  getUpcomingClasses,
  getClassesPaginated,
  confirmAttendance,
  denyAttendance,
  getClassById,
} from '../../api/classes';
import { ENDPOINTS } from '../../api/config';

// Mock API client
jest.mock('../../api/client');

const mockApi = api as jest.Mocked<typeof api>;

describe('Classes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpcomingClasses', () => {
    it('should fetch and transform upcoming classes', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1000032,
              class: {
                id: 1000000,
                name: 'Brazilian Jiu-Jitsu Fundamentals',
                description: 'Learn the basics of BJJ',
                level: 'Beginner',
                discipline: 'Brazilian Jiu-Jitsu',
                max_participants: 20,
                requires_assignment: false,
              },
              starts_at: '2025-11-30T10:00:00.000000Z',
              ends_at: '2025-11-30T11:00:00.000000Z',
              trainer: 'John Doe',
              venue: {
                id: 1000000,
                name: 'Main Venue',
              },
              capacity: {
                max: 20,
                is_full: false,
                available_spots: 5,
              },
              user_status: {
                has_intention: true,
                intention: 'confirmed',
                can_register: true,
              },
            },
            {
              id: 1000033,
              class: {
                id: 1000001,
                name: 'Advanced Grappling',
                description: null,
                level: null,
                discipline: 'Brazilian Jiu-Jitsu',
                max_participants: null,
                requires_assignment: false,
              },
              starts_at: '2025-12-01T14:00:00.000000Z',
              ends_at: '2025-12-01T15:30:00.000000Z',
              trainer: null,
              venue: {
                id: 1000000,
                name: 'Main Venue',
              },
              capacity: {
                max: null,
                is_full: false,
                available_spots: null,
              },
              user_status: {
                has_intention: false,
                intention: null,
                can_register: true,
              },
            },
          ],
          meta: {
            total: 2,
            limit: '10',
            has_assignments: false,
          },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      const result = await getUpcomingClasses();

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.CLASSES.NEXT}`);
      expect(result).toHaveLength(2);

      // Verify first class transformation
      expect(result[0]).toEqual({
        id: '1000032',
        title: 'Brazilian Jiu-Jitsu Fundamentals',
        instructor: 'John Doe',
        instructorAvatar: '',
        date: '2025-11-30T10:00:00.000000Z',
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        location: 'Main Venue',
        capacity: {
          max: 20,
          is_full: false,
          available_spots: 5,
        },
        enrolled: 15, // max - available_spots
        status: 'confirmed',
        description: 'Learn the basics of BJJ',
        level: 'Beginner',
        category: 'Brazilian Jiu-Jitsu',
      });

      // Verify second class transformation (with nulls)
      expect(result[1]).toEqual({
        id: '1000033',
        title: 'Advanced Grappling',
        instructor: 'TBA',
        instructorAvatar: '',
        date: '2025-12-01T14:00:00.000000Z',
        startTime: '14:00',
        endTime: '15:30',
        duration: 90,
        location: 'Main Venue',
        capacity: {
          max: null,
          is_full: false,
          available_spots: null,
        },
        enrolled: 0,
        status: 'pending',
        description: '',
        level: '',
        category: 'Brazilian Jiu-Jitsu',
      });
    });

    it('should fetch classes with limit parameter', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [],
          meta: { total: 0, limit: '5', has_assignments: false },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      await getUpcomingClasses(5);

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.CLASSES.NEXT}?limit=5`);
    });

    it('should handle user with denied status', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1000034,
              class: {
                id: 1000000,
                name: 'Test Class',
                description: null,
                level: null,
                discipline: 'BJJ',
                max_participants: 10,
                requires_assignment: false,
              },
              starts_at: '2025-12-01T10:00:00.000000Z',
              ends_at: '2025-12-01T11:00:00.000000Z',
              trainer: 'Trainer',
              venue: { id: 1, name: 'Venue' },
              capacity: { max: 10, is_full: false, available_spots: 5 },
              user_status: {
                has_intention: true,
                intention: 'denied',
                can_register: false,
              },
            },
          ],
          meta: { total: 1, limit: '10', has_assignments: false },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      const result = await getUpcomingClasses();

      expect(result[0].status).toBe('denied');
    });

    it('should throw error when API returns error', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Failed to fetch classes',
      });

      await expect(getUpcomingClasses()).rejects.toThrow('Failed to fetch classes');
    });

    it('should throw error on network failure', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Network error',
      });

      await expect(getUpcomingClasses()).rejects.toThrow('Network error');
    });
  });

  describe('getClassesPaginated', () => {
    it('should fetch classes with pagination', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1000032,
              class: {
                id: 1000000,
                name: 'Test Class',
                description: null,
                level: null,
                discipline: 'BJJ',
                max_participants: 10,
                requires_assignment: false,
              },
              starts_at: '2025-11-30T10:00:00.000000Z',
              ends_at: '2025-11-30T11:00:00.000000Z',
              trainer: 'Trainer',
              venue: { id: 1, name: 'Venue' },
              capacity: { max: 10, is_full: false, available_spots: 5 },
              user_status: {
                has_intention: false,
                intention: null,
                can_register: true,
              },
            },
          ],
          meta: {
            total: 50,
            limit: '10',
            has_assignments: false,
          },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      const result = await getClassesPaginated(10);

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.CLASSES.NEXT}?limit=10`);
      expect(result.classes).toHaveLength(1);
      expect(result.total).toBe(50);
    });

    it('should use default limit of 10', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [],
          meta: { total: 0, limit: '10', has_assignments: false },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      await getClassesPaginated();

      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.CLASSES.NEXT}?limit=10`);
    });
  });

  describe('confirmAttendance', () => {
    it('should confirm attendance for a class', async () => {
      const mockResponse = {
        data: { success: true },
        error: null,
      };

      mockApi.post.mockResolvedValue(mockResponse);

      await confirmAttendance('1000032');

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.ATTENDANCE.CREATE_INTENTION, {
        occurrence_id: 1000032,
        decision: 'confirm',
        notes: '',
      });
    });

    it('should confirm attendance with notes', async () => {
      const mockResponse = {
        data: { success: true },
        error: null,
      };

      mockApi.post.mockResolvedValue(mockResponse);

      await confirmAttendance('1000032', 'See you there!');

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.ATTENDANCE.CREATE_INTENTION, {
        occurrence_id: 1000032,
        decision: 'confirm',
        notes: 'See you there!',
      });
    });

    it('should throw error when confirmation fails', async () => {
      mockApi.post.mockResolvedValue({
        data: null,
        error: 'Class is full',
      });

      await expect(confirmAttendance('1000032')).rejects.toThrow('Class is full');
    });
  });

  describe('denyAttendance', () => {
    it('should deny attendance for a class', async () => {
      const mockResponse = {
        data: { success: true },
        error: null,
      };

      mockApi.post.mockResolvedValue(mockResponse);

      await denyAttendance('1000032');

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.ATTENDANCE.CREATE_INTENTION, {
        occurrence_id: 1000032,
        decision: 'decline',
        notes: '',
      });
    });

    it('should deny attendance with notes', async () => {
      const mockResponse = {
        data: { success: true },
        error: null,
      };

      mockApi.post.mockResolvedValue(mockResponse);

      await denyAttendance('1000032', 'Cannot make it');

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.ATTENDANCE.CREATE_INTENTION, {
        occurrence_id: 1000032,
        decision: 'decline',
        notes: 'Cannot make it',
      });
    });

    it('should throw error when denial fails', async () => {
      mockApi.post.mockResolvedValue({
        data: null,
        error: 'Failed to cancel',
      });

      await expect(denyAttendance('1000032')).rejects.toThrow('Failed to cancel');
    });
  });

  describe('getClassById', () => {
    it('should fetch a single class by ID', async () => {
      const mockResponse = {
        data: {
          class: {
            id: '1000032',
            title: 'Test Class',
          },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getClassById('1000032');

      expect(mockApi.get).toHaveBeenCalledWith(ENDPOINTS.CLASSES.DETAILS('1000032'));
      expect(result).toEqual(mockResponse.data.class);
    });

    it('should return null when class not found', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Not found',
      });

      const result = await getClassById('999999');

      expect(result).toBeNull();
    });
  });

  describe('Time formatting', () => {
    it('should correctly format times from ISO timestamps', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1,
              class: {
                id: 1,
                name: 'Class',
                description: null,
                level: null,
                discipline: 'BJJ',
                max_participants: 10,
                requires_assignment: false,
              },
              starts_at: '2025-11-30T09:15:00.000000Z',
              ends_at: '2025-11-30T10:45:00.000000Z',
              trainer: null,
              venue: { id: 1, name: 'Venue' },
              capacity: { max: null, is_full: false, available_spots: null },
              user_status: { has_intention: false, intention: null, can_register: true },
            },
          ],
          meta: { total: 1, limit: '10', has_assignments: false },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      const result = await getUpcomingClasses();

      expect(result[0].startTime).toBe('09:15');
      expect(result[0].endTime).toBe('10:45');
      expect(result[0].duration).toBe(90);
    });
  });

  describe('Capacity calculations', () => {
    it('should calculate enrolled count when max and available_spots are provided', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1,
              class: {
                id: 1,
                name: 'Class',
                description: null,
                level: null,
                discipline: 'BJJ',
                max_participants: 20,
                requires_assignment: false,
              },
              starts_at: '2025-11-30T10:00:00.000000Z',
              ends_at: '2025-11-30T11:00:00.000000Z',
              trainer: null,
              venue: { id: 1, name: 'Venue' },
              capacity: { max: 20, is_full: false, available_spots: 7 },
              user_status: { has_intention: false, intention: null, can_register: true },
            },
          ],
          meta: { total: 1, limit: '10', has_assignments: false },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      const result = await getUpcomingClasses();

      expect(result[0].enrolled).toBe(13); // 20 - 7
    });

    it('should set enrolled to 0 when capacity data is null', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1,
              class: {
                id: 1,
                name: 'Class',
                description: null,
                level: null,
                discipline: 'BJJ',
                max_participants: null,
                requires_assignment: false,
              },
              starts_at: '2025-11-30T10:00:00.000000Z',
              ends_at: '2025-11-30T11:00:00.000000Z',
              trainer: null,
              venue: { id: 1, name: 'Venue' },
              capacity: { max: null, is_full: false, available_spots: null },
              user_status: { has_intention: false, intention: null, can_register: true },
            },
          ],
          meta: { total: 1, limit: '10', has_assignments: false },
        },
        error: null,
      };

      mockApi.get.mockResolvedValue(mockApiResponse);

      const result = await getUpcomingClasses();

      expect(result[0].enrolled).toBe(0);
    });
  });
});
