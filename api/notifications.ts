import { api } from './client';
import { ENDPOINTS } from './config';

import { IconName } from '@/components/Icon';

// API Response Types (snake_case as returned by backend)
interface ApiNotificationUser {
  id: number;
  name: string;
  avatar: string | null;
}

interface ApiNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  created_at: string;
  action_url: string | null;
  user: ApiNotificationUser | null;
}

interface ApiNotificationsResponse {
  success: boolean;
  data: ApiNotification[];
  meta: {
    total: number;
    unread_count: number;
    next_cursor: string | null;
  };
}

interface ApiMarkReadResponse {
  success: boolean;
}

interface ApiMarkAllReadResponse {
  success: boolean;
  marked_count: number;
}

// App Types (camelCase)
export type NotificationType = 'class' | 'achievement' | 'reminder' | 'billing';

export interface NotificationUser {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: IconName;
  read: boolean;
  createdAt: string;
  timeAgo: string;
  actionUrl: string | null;
  user: NotificationUser | null;
}

export interface NotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  nextCursor: string | null;
}

export interface GetNotificationsParams {
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
}

/**
 * Calculate relative time string (e.g., "2 min ago", "1 hour ago")
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Transform API notification to app notification
 */
function transformNotification(apiNotification: ApiNotification): Notification {
  return {
    id: apiNotification.id,
    type: apiNotification.type,
    title: apiNotification.title,
    message: apiNotification.message,
    icon: apiNotification.icon as IconName,
    read: apiNotification.read,
    createdAt: apiNotification.created_at,
    timeAgo: getTimeAgo(apiNotification.created_at),
    actionUrl: apiNotification.action_url,
    user: apiNotification.user,
  };
}

/**
 * Fetch notifications from the API
 */
export async function getNotifications(
  params: GetNotificationsParams = {}
): Promise<NotificationsResult> {
  const queryParams = new URLSearchParams();

  if (params.type) {
    queryParams.append('type', params.type);
  }
  if (params.unreadOnly) {
    queryParams.append('unread_only', 'true');
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.cursor) {
    queryParams.append('cursor', params.cursor);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `${ENDPOINTS.NOTIFICATIONS.LIST}?${queryString}`
    : ENDPOINTS.NOTIFICATIONS.LIST;

  const response = await api.get<ApiNotificationsResponse>(url);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch notifications');
  }

  return {
    notifications: response.data.data.map(transformNotification),
    total: response.data.meta.total,
    unreadCount: response.data.meta.unread_count,
    nextCursor: response.data.meta.next_cursor,
  };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const response = await api.post<ApiMarkReadResponse>(
    ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)
  );

  if (response.error) {
    throw new Error(response.error || 'Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(type?: NotificationType): Promise<number> {
  const queryParams = type ? `?type=${type}` : '';
  const url = `${ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}${queryParams}`;

  const response = await api.post<ApiMarkAllReadResponse>(url);

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to mark all notifications as read');
  }

  return response.data.marked_count;
}
