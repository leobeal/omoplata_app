import {
  getThreads,
  getThread,
  getMessages,
  sendMessage,
  markThreadAsRead,
  getParticipant,
  isCurrentUserMessage,
  formatThreadTimestamp,
  formatMessageTimestamp,
  formatMessageDateHeader,
  Thread,
  Message,
  PaginatedThreads,
  PaginatedMessages,
} from '../../api/messages';
import api from '../../api/client';

// Mock API client
jest.mock('../../api/client');

const mockApi = api as jest.Mocked<typeof api>;

// Mock data
const mockThread: Thread = {
  id: 'thread-1',
  type: 'direct',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  participants: [
    { id: 'user-1', name: 'John Doe', avatar: null, role: 'instructor' },
    { id: 'user-2', name: 'Jane Smith', avatar: null, role: 'member' },
  ],
  lastMessage: {
    id: 'msg-1',
    text: 'Hello!',
    senderId: 'user-1',
    timestamp: '2025-12-20T10:00:00Z',
    status: 'read',
  },
  unreadCount: 0,
  updatedAt: '2025-12-20T10:00:00Z',
};

const mockGroupThread: Thread = {
  id: 'thread-2',
  type: 'group',
  name: 'BJJ Fundamentals',
  avatar: null,
  participants: [
    { id: 'user-1', name: 'Coach Mike', avatar: null, role: 'instructor' },
    { id: 'user-2', name: 'Jane Smith', avatar: null, role: 'member' },
    { id: 'user-3', name: 'Bob Wilson', avatar: null, role: 'member' },
  ],
  memberCount: 15,
  lastMessage: {
    id: 'msg-2',
    text: 'Class at 6pm today',
    senderId: 'user-1',
    timestamp: '2025-12-20T09:00:00Z',
    status: 'delivered',
  },
  unreadCount: 3,
  updatedAt: '2025-12-20T09:00:00Z',
};

const mockMessage: Message = {
  id: 'msg-1',
  text: 'Hello there!',
  senderId: 'user-1',
  timestamp: '2025-12-20T10:30:00Z',
  status: 'sent',
};

describe('Messages API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getThreads', () => {
    it('should fetch threads with default pagination', async () => {
      const mockResponse: PaginatedThreads = {
        threads: [mockThread, mockGroupThread],
        hasMore: true,
        nextCursor: 'cursor-123',
      };

      mockApi.get.mockResolvedValue({
        data: mockResponse,
        error: null,
        status: 200,
      });

      const result = await getThreads();

      expect(mockApi.get).toHaveBeenCalledWith('/messages/threads?limit=20');
      expect(result.threads).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cursor-123');
    });

    it('should fetch threads with custom limit', async () => {
      const mockResponse: PaginatedThreads = {
        threads: [mockThread],
        hasMore: false,
      };

      mockApi.get.mockResolvedValue({
        data: mockResponse,
        error: null,
        status: 200,
      });

      await getThreads(10);

      expect(mockApi.get).toHaveBeenCalledWith('/messages/threads?limit=10');
    });

    it('should fetch threads with cursor for pagination', async () => {
      const mockResponse: PaginatedThreads = {
        threads: [mockGroupThread],
        hasMore: false,
      };

      mockApi.get.mockResolvedValue({
        data: mockResponse,
        error: null,
        status: 200,
      });

      await getThreads(20, 'cursor-abc');

      expect(mockApi.get).toHaveBeenCalledWith('/messages/threads?limit=20&cursor=cursor-abc');
    });

    it('should throw error when API returns error', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Failed to fetch threads',
        status: 500,
      });

      await expect(getThreads()).rejects.toThrow('Failed to fetch threads');
    });
  });

  describe('getThread', () => {
    it('should fetch a single thread by ID', async () => {
      mockApi.get.mockResolvedValue({
        data: { data: mockThread },
        error: null,
        status: 200,
      });

      const result = await getThread('thread-1');

      expect(mockApi.get).toHaveBeenCalledWith('/messages/threads/thread-1');
      expect(result.id).toBe('thread-1');
      expect(result.name).toBe('John Doe');
    });

    it('should throw error when thread not found', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Thread not found',
        status: 404,
      });

      await expect(getThread('invalid-id')).rejects.toThrow('Thread not found');
    });
  });

  describe('getMessages', () => {
    it('should fetch messages for a thread with default pagination', async () => {
      const mockResponse: PaginatedMessages = {
        messages: [mockMessage],
        hasMore: true,
        nextCursor: 'msg-cursor-123',
      };

      mockApi.get.mockResolvedValue({
        data: mockResponse,
        error: null,
        status: 200,
      });

      const result = await getMessages('thread-1');

      expect(mockApi.get).toHaveBeenCalledWith('/messages/threads/thread-1/messages?limit=20');
      expect(result.messages).toHaveLength(1);
      expect(result.hasMore).toBe(true);
    });

    it('should fetch messages with custom limit and cursor', async () => {
      const mockResponse: PaginatedMessages = {
        messages: [],
        hasMore: false,
      };

      mockApi.get.mockResolvedValue({
        data: mockResponse,
        error: null,
        status: 200,
      });

      await getMessages('thread-1', 50, 'cursor-xyz');

      expect(mockApi.get).toHaveBeenCalledWith(
        '/messages/threads/thread-1/messages?limit=50&cursor=cursor-xyz'
      );
    });

    it('should throw error when API fails', async () => {
      mockApi.get.mockResolvedValue({
        data: null,
        error: 'Failed to fetch messages',
        status: 500,
      });

      await expect(getMessages('thread-1')).rejects.toThrow('Failed to fetch messages');
    });
  });

  describe('sendMessage', () => {
    it('should send a message to a thread', async () => {
      const sentMessage: Message = {
        id: 'msg-new',
        text: 'Hello world!',
        senderId: 'user-2',
        timestamp: '2025-12-20T11:00:00Z',
        status: 'sent',
      };

      mockApi.post.mockResolvedValue({
        data: sentMessage,
        error: null,
        status: 201,
      });

      const result = await sendMessage('thread-1', { text: 'Hello world!' });

      expect(mockApi.post).toHaveBeenCalledWith('/messages/threads/thread-1/messages', {
        text: 'Hello world!',
      });
      expect(result.id).toBe('msg-new');
      expect(result.text).toBe('Hello world!');
    });

    it('should throw error when sending fails', async () => {
      mockApi.post.mockResolvedValue({
        data: null,
        error: 'Message too long',
        status: 400,
      });

      await expect(sendMessage('thread-1', { text: 'test' })).rejects.toThrow('Message too long');
    });
  });

  describe('markThreadAsRead', () => {
    it('should mark a thread as read', async () => {
      mockApi.post.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      await markThreadAsRead('thread-1');

      expect(mockApi.post).toHaveBeenCalledWith('/messages/threads/thread-1/read');
    });

    it('should throw error when marking as read fails', async () => {
      mockApi.post.mockResolvedValue({
        data: null,
        error: 'Thread not found',
        status: 404,
      });

      await expect(markThreadAsRead('invalid-id')).rejects.toThrow('Thread not found');
    });
  });

  describe('Helper Functions', () => {
    describe('getParticipant', () => {
      it('should find participant by ID', () => {
        const participant = getParticipant(mockThread, 'user-1');

        expect(participant).toBeDefined();
        expect(participant?.name).toBe('John Doe');
        expect(participant?.role).toBe('instructor');
      });

      it('should return undefined for non-existent participant', () => {
        const participant = getParticipant(mockThread, 'user-999');

        expect(participant).toBeUndefined();
      });
    });

    describe('isCurrentUserMessage', () => {
      it('should return true when sender matches current user', () => {
        expect(isCurrentUserMessage('user-1', 'user-1')).toBe(true);
      });

      it('should return false when sender does not match current user', () => {
        expect(isCurrentUserMessage('user-1', 'user-2')).toBe(false);
      });
    });

    describe('formatThreadTimestamp', () => {
      beforeEach(() => {
        // Mock current date to 2025-12-20 12:00:00
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-12-20T12:00:00Z'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should format today timestamp as time', () => {
        const result = formatThreadTimestamp('2025-12-20T10:30:00Z');
        // Should be formatted as time (locale-dependent)
        expect(result).toMatch(/\d{1,2}:\d{2}/);
      });

      it('should format yesterday as "Yesterday"', () => {
        const result = formatThreadTimestamp('2025-12-19T10:00:00Z');
        expect(result).toBe('Yesterday');
      });

      it('should format dates within a week as weekday', () => {
        const result = formatThreadTimestamp('2025-12-16T10:00:00Z');
        // Should be a short weekday like "Mon", "Tue", etc.
        expect(result).toMatch(/^[A-Z][a-z]{2}$/);
      });

      it('should format older dates as month and day', () => {
        const result = formatThreadTimestamp('2025-11-15T10:00:00Z');
        // Should be like "Nov 15"
        expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}/);
      });
    });

    describe('formatMessageTimestamp', () => {
      it('should format timestamp as time', () => {
        const result = formatMessageTimestamp('2025-12-20T14:30:00Z');
        // Should be formatted as time
        expect(result).toMatch(/\d{1,2}:\d{2}/);
      });
    });

    describe('formatMessageDateHeader', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-12-20T12:00:00Z'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should return "Today" for today', () => {
        const result = formatMessageDateHeader('2025-12-20T10:00:00Z');
        expect(result).toBe('Today');
      });

      it('should return "Yesterday" for yesterday', () => {
        const result = formatMessageDateHeader('2025-12-19T10:00:00Z');
        expect(result).toBe('Yesterday');
      });

      it('should return full date for older dates', () => {
        const result = formatMessageDateHeader('2025-12-15T10:00:00Z');
        // Should be like "Monday, December 15"
        expect(result).toMatch(/[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}/);
      });
    });
  });

  describe('Thread Types', () => {
    it('should handle direct thread correctly', () => {
      expect(mockThread.type).toBe('direct');
      expect(mockThread.memberCount).toBeUndefined();
    });

    it('should handle group thread correctly', () => {
      expect(mockGroupThread.type).toBe('group');
      expect(mockGroupThread.memberCount).toBe(15);
    });
  });

  describe('Message Status', () => {
    it('should handle all message statuses', () => {
      const statuses: Message['status'][] = ['sent', 'delivered', 'read'];

      statuses.forEach((status) => {
        const message: Message = { ...mockMessage, status };
        expect(['sent', 'delivered', 'read']).toContain(message.status);
      });
    });
  });

  describe('Participant Roles', () => {
    it('should handle all participant roles', () => {
      const instructor = mockThread.participants.find((p) => p.role === 'instructor');
      const member = mockThread.participants.find((p) => p.role === 'member');

      expect(instructor).toBeDefined();
      expect(member).toBeDefined();
    });
  });
});
