import { Stack } from 'expo-router';
import { Platform } from 'react-native';

// Platform-specific animation defaults for smooth transitions
const defaultAnimation = Platform.OS === 'android' ? 'slide_from_right' : 'default';
const fadeAnimation = 'fade';
const modalAnimation = Platform.OS === 'android' ? 'slide_from_bottom' : 'default';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Use native-feeling slide animation (feels native on Android)
        animation: defaultAnimation,
        // Smoother animation timing on iOS
        animationDuration: Platform.OS === 'ios' ? 300 : undefined,
      }}>
      {/* Auth screens use fade for smooth transitions */}
      <Stack.Screen name="login" options={{ animation: fadeAnimation }} />
      <Stack.Screen name="forgot-password" options={{ animation: fadeAnimation }} />
      <Stack.Screen name="tenant-selection" options={{ animation: fadeAnimation }} />

      {/* Settings and profile screens - slide from right (default) */}
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />

      {/* Membership and billing screens - slide from right (default) */}
      <Stack.Screen name="membership" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="invoice-detail" />
      <Stack.Screen name="cancel-membership" />

      {/* Classes and calendar screens - slide from right (default) */}
      <Stack.Screen name="calendar" />
      <Stack.Screen name="next-classes" />

      {/* Messages */}
      <Stack.Screen name="message-thread" />

      {/* Modal-like screens slide from bottom for action focus */}
      <Stack.Screen name="checkin" options={{ animation: modalAnimation }} />
      <Stack.Screen name="membership-card" options={{ animation: modalAnimation }} />
    </Stack>
  );
}
