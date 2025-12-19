import api from './client';

// Types
export type ThreadType = 'direct' | 'group';
export type ParticipantRole = 'instructor' | 'admin' | 'member';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Participant {
  id: string;
  name: string;
  avatar: string | null;
  role: ParticipantRole;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  status: MessageStatus;
}

export interface Thread {
  id: string;
  type: ThreadType;
  name: string;
  avatar: string | null;
  participants: Participant[];
  memberCount?: number;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export interface PaginatedThreads {
  threads: Thread[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginatedMessages {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface SendMessagePayload {
  text: string;
}

// API Endpoints

/**
 * Get paginated list of threads
 * GET /api/messages/threads?limit=20&cursor=xxx
 */
export const getThreads = async (
  limit: number = 20,
  cursor?: string
): Promise<PaginatedThreads> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await api.get<PaginatedThreads>(`/messages/threads?${params.toString()}`);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
};

/**
 * Get a single thread by ID
 * GET /api/messages/threads/:threadId
 */
export const getThread = async (threadId: string): Promise<Thread> => {
  const response = await api.get<{ data: Thread }>(`/messages/threads/${threadId}`);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!.data;
};

/**
 * Get paginated messages for a thread
 * Returns newest messages first, with cursor for loading older messages
 * GET /api/messages/threads/:threadId/messages?limit=10&cursor=xxx
 */
export const getMessages = async (
  threadId: string,
  limit: number = 20,
  cursor?: string
): Promise<PaginatedMessages> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await api.get<PaginatedMessages>(
    `/messages/threads/${threadId}/messages?${params.toString()}`
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
};

/**
 * Send a message to a thread
 * POST /api/messages/threads/:threadId/messages
 */
export const sendMessage = async (
  threadId: string,
  payload: SendMessagePayload
): Promise<Message> => {
  const response = await api.post<Message>(`/messages/threads/${threadId}/messages`, payload);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
};

/**
 * Mark a thread as read
 * POST /api/messages/threads/:threadId/read
 */
export const markThreadAsRead = async (threadId: string): Promise<void> => {
  const response = await api.post<{ success: boolean }>(`/messages/threads/${threadId}/read`);

  if (response.error) {
    throw new Error(response.error);
  }
};

// Helper Functions

/**
 * Get participant by ID from a thread
 */
export const getParticipant = (thread: Thread, participantId: string): Participant | undefined => {
  return thread.participants.find((p) => p.id === participantId);
};

/**
 * Check if the current user is the sender
 */
export const isCurrentUserMessage = (senderId: string, currentUserId: string): boolean => {
  return senderId === currentUserId;
};

/**
 * Format timestamp for display in thread list
 */
export const formatThreadTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

/**
 * Format timestamp for display in message detail
 */
export const formatMessageTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

/**
 * Format date header for message groups
 */
export const formatMessageDateHeader = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
};
