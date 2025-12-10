/**
 * Notification Context
 *
 * Manages push notification registration and handling in a tenant-aware manner.
 * Automatically registers push tokens when user is authenticated and has selected a tenant.
 */

import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  getExpoPushToken,
  registerPushTokenWithServer,
  unregisterPushTokenFromServer,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  clearBadgeCount,
} from '@/utils/push-notifications';

interface NotificationContextType {
  // State
  expoPushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  isRegistering: boolean;

  // Actions
  requestPermission: () => Promise<boolean>;
  registerToken: () => Promise<void>;
  unregisterToken: () => Promise<void>;

  // Notification handling
  lastNotificationResponse: Notifications.NotificationResponse | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated, token: authToken } = useAuth();
  const { tenant } = useTenant();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastNotificationResponse, setLastNotificationResponse] =
    useState<Notifications.NotificationResponse | null>(null);

  // Refs for notification listeners
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Track previous auth state to detect login/logout
  const previousAuthToken = useRef<string | null>(null);

  /**
   * Check current permission status
   */
  const checkPermissionStatus = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionStatus(status);
    return status;
  }, []);

  /**
   * Request notification permission from user
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    await checkPermissionStatus();
    return granted;
  }, [checkPermissionStatus]);

  /**
   * Register push token with server
   * Only registers if authenticated and has a tenant
   */
  const registerToken = useCallback(async () => {
    if (!isAuthenticated || !tenant) {
      console.log('[Notifications] Skipping token registration - not authenticated or no tenant');
      return;
    }

    setIsRegistering(true);

    try {
      // Get the Expo push token
      const token = await getExpoPushToken();

      if (!token) {
        console.log('[Notifications] No push token available');
        return;
      }

      setExpoPushToken(token);

      // Register with backend server
      const success = await registerPushTokenWithServer(token);

      if (success) {
        console.log(`[Notifications] Token registered for tenant: ${tenant.slug}`);
      }
    } catch (error) {
      console.error('[Notifications] Error registering token:', error);
    } finally {
      setIsRegistering(false);
    }
  }, [isAuthenticated, tenant]);

  /**
   * Unregister push token from server
   * Called on logout
   */
  const unregisterToken = useCallback(async () => {
    if (!expoPushToken) {
      return;
    }

    try {
      await unregisterPushTokenFromServer(expoPushToken);
      setExpoPushToken(null);
      await clearBadgeCount();
      console.log('[Notifications] Token unregistered');
    } catch (error) {
      console.error('[Notifications] Error unregistering token:', error);
    }
  }, [expoPushToken]);

  /**
   * Handle incoming notification while app is foregrounded
   */
  const handleNotification = useCallback((notification: Notifications.Notification) => {
    console.log('[Notifications] Received notification:', notification.request.content.title);
    // You can add custom handling here, e.g., show in-app toast
  }, []);

  /**
   * Handle notification response (user tapped notification)
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    console.log('[Notifications] User tapped notification:', response.notification.request.content);
    setLastNotificationResponse(response);

    // Extract data from notification for navigation
    const data = response.notification.request.content.data;

    // You can add navigation logic here based on notification data
    // Example: if (data.screen) { router.push(data.screen); }
    if (data) {
      console.log('[Notifications] Notification data:', data);
    }
  }, []);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications when app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener(handleNotification);

    // Listen for notification responses (taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        setLastNotificationResponse(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotification, handleNotificationResponse]);

  // Auto-register token when user logs in
  useEffect(() => {
    const wasAuthenticated = previousAuthToken.current !== null;
    const isNowAuthenticated = authToken !== null;

    // User just logged in
    if (!wasAuthenticated && isNowAuthenticated && tenant) {
      console.log('[Notifications] User logged in, registering push token...');
      registerToken();
    }

    // User just logged out - unregister token
    if (wasAuthenticated && !isNowAuthenticated && expoPushToken) {
      console.log('[Notifications] User logged out, unregistering push token...');
      // Note: unregisterToken is called but may fail if auth is already cleared
      // The server should also clean up stale tokens periodically
      unregisterToken();
    }

    previousAuthToken.current = authToken;
  }, [authToken, tenant, registerToken, unregisterToken, expoPushToken]);

  // Re-register when tenant changes (for multi-tenant builds)
  useEffect(() => {
    if (isAuthenticated && tenant && permissionStatus === 'granted') {
      registerToken();
    }
  }, [tenant?.slug]); // Only re-register when tenant slug changes

  const value: NotificationContextType = {
    expoPushToken,
    permissionStatus,
    isRegistering,
    requestPermission,
    registerToken,
    unregisterToken,
    lastNotificationResponse,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
