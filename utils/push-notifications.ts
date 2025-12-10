/**
 * Push Notification Utilities
 *
 * Handles Expo push notification registration and token management.
 * Works with EAS Build to automatically configure push credentials.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushTokenRegistration {
  token: string;
  platform: 'ios' | 'android';
  deviceName?: string;
}

/**
 * Request permission and get the Expo push token
 * @returns The Expo push token string or null if permission denied/unavailable
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Push] Push notifications require a physical device');
    return null;
  }

  // Check existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted for push notifications');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await setupAndroidNotificationChannel();
  }

  try {
    // Get the EAS project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('[Push] EAS project ID not found in app config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] Got Expo push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('[Push] Failed to get push token:', error);
    return null;
  }
}

/**
 * Setup Android notification channel (required for Android 8.0+)
 */
async function setupAndroidNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

/**
 * Register push token with the backend server
 * Call this after user authentication
 */
export async function registerPushTokenWithServer(token: string): Promise<boolean> {
  try {
    const registration: PushTokenRegistration = {
      token,
      platform: Platform.OS as 'ios' | 'android',
      deviceName: Device.deviceName || undefined,
    };

    const response = await api.post(ENDPOINTS.PUSH.REGISTER_TOKEN, registration);

    if (response.error) {
      console.error('[Push] Failed to register token with server:', response.error);
      return false;
    }

    console.log('[Push] Token registered with server successfully');
    return true;
  } catch (error) {
    console.error('[Push] Error registering token:', error);
    return false;
  }
}

/**
 * Unregister push token from the backend server
 * Call this on logout
 */
export async function unregisterPushTokenFromServer(token: string): Promise<boolean> {
  try {
    const response = await api.post(ENDPOINTS.PUSH.UNREGISTER_TOKEN, { token });

    if (response.error) {
      console.error('[Push] Failed to unregister token:', response.error);
      return false;
    }

    console.log('[Push] Token unregistered from server successfully');
    return true;
  } catch (error) {
    console.error('[Push] Error unregistering token:', error);
    return false;
  }
}

/**
 * Get the current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Set the badge count on the app icon
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear the badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
